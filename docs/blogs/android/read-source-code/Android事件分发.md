---
title: android 事件分发机制
date: 2025-12-01
categories:
  - android
tags:
  - android
  - 源码分析
---

# android 事件分发机制分析
  我们的应用activity展示从activity开始分析

## Activity.dispatchTouchEvent
```java
public boolean dispatchTouchEvent(MotionEvent ev) {
    if (ev.getAction() == MotionEvent.ACTION_DOWN) {
        onUserInteraction();
    }
    if (getWindow().superDispatchTouchEvent(ev)) {
        return true;
    }
    return onTouchEvent(ev);
}
```
我们可以重写onUserInteraction()拦截所有的触摸事件，然后getWindow().superDispatchTouchEvent(ev) 分发触摸事件，getWindow获取Window对象，Window只有PhoneWindow这一个子类，也就是实际调用到PhoneWindow的superDispatchTouchEvent

## PhoneWindow.superDispatchTouchEvent
```java
private DecorView mDecor;

@Override
public boolean superDispatchTouchEvent(MotionEvent event) {
    return mDecor.superDispatchTouchEvent(event);
}
```
可以看到里面调用的DecorView.superDispatchTouchEvent，DecorView继承自FrameLayout，在FrameLayout中是没有这个方法的，再往上找，可以看到是调用的ViewGroup中的dispatchTouchEvent。

## ViewGroup.dispatchTouchEvent
```java
@Override
public boolean dispatchTouchEvent(MotionEvent ev) {
    // ... 省略前置判断（如事件是否为空、是否被禁用等）

    boolean handled = false;
    if (onFilterTouchEventForSecurity(ev)) {
        final int action = ev.getAction();
        final int actionMasked = action & MotionEvent.ACTION_MASK;

        // 1. DOWN事件：初始化触摸状态（重置拦截标记、清空目标View等）
        if (actionMasked == MotionEvent.ACTION_DOWN) {
            cancelAndClearTouchTargets(ev);
            resetTouchState();
        }

        // 2. 判断是否拦截事件
        final boolean intercepted;
        if (actionMasked == MotionEvent.ACTION_DOWN
                || mFirstTouchTarget != null) {
            final boolean disallowIntercept = (mGroupFlags & FLAG_DISALLOW_INTERCEPT) != 0;
            if (!disallowIntercept) {
                intercepted = onInterceptTouchEvent(ev); // 调用拦截方法
                ev.setAction(action); // 恢复事件action（防止被修改）
            } else {
                intercepted = false;
            }
        } else {
            // 非DOWN事件且无触摸目标，直接拦截
            intercepted = true;
        }

        // ... 省略事件取消/终止的处理逻辑

        // 3. 若未拦截，查找子View并分发事件
        if (!intercepted && !canceled) {
            // ... 省略子View遍历逻辑（从最上层View开始）
            for (int i = childrenCount - 1; i >= 0; i--) {
                final View child = ...; // 获取子View
                // 检查子View是否可接收事件（可见、触摸区域内等）
                if (!child.canReceivePointerEvents()
                        || !isTransformedTouchPointInView(x, y, child, null)) {
                    continue;
                }

                // 4. 分发事件到子View
                newTouchTarget = getTouchTarget(child);
                if (newTouchTarget != null) {
                    newTouchTarget.pointerIdBits |= idBitsToAssign;
                    break;
                }

                resetCancelNextUpFlag(child);
                // 调用子View的dispatchTouchEvent
                if (dispatchTransformedTouchEvent(ev, false, child, idBitsToAssign)) {
                    // 子View消费事件，记录触摸目标
                    mLastTouchDownTime = ev.getDownTime();
                    if (preorderedList != null) {
                        for (int j = 0; j < childrenCount; j++) {
                            if (children[childIndex] == child) {
                                mLastTouchDownIndex = j;
                                break;
                            }
                        }
                    } else {
                        mLastTouchDownIndex = childIndex;
                    }
                    mLastTouchDownX = ev.getX();
                    mLastTouchDownY = ev.getY();
                    newTouchTarget = addTouchTarget(child, idBitsToAssign);
                    alreadyDispatchedToNewTouchTarget = true;
                    break;
                }
            }
        }

        // 5. 若未找到子View消费，或已拦截，调用自身的dispatchTransformedTouchEvent
        if (mFirstTouchTarget == null) {
            handled = dispatchTransformedTouchEvent(ev, canceled, null,
                    TouchTarget.ALL_POINTER_IDS);
        } else {
            // ... 省略多触摸点的处理逻辑
        }
    }

    // ... 省略后置处理逻辑
    return handled;
}
```
1. 事件拦截判断 
    * 从源码可以看到，仅在down事件或已有触摸目标(mFirstTouchTarget != null)时，才调用onInterceptTouchEvent.
    * 子view可通过 requestDisallowInterceptTouchEvent(true) 设置阻止 ViewGroup 拦截（如 ViewPager 滑动时的处理）
2. 子View遍历规则  
    ViewGroup 按子View最上层View开始，通过isTransformedTouchPointInView判断左边是否在子view范围内，找到第一个可接收事件的子View。
3. 事件分发到子View  
    调用disPatchTransformedTouchEvent间接调用子view的dispatchTouchEvent
```java
private boolean dispatchTransformedTouchEvent(MotionEvent event, boolean cancel,
        View child, int desiredPointerIdBits) {
    final boolean handled;
    // 若child为null，调用自身的super.dispatchTouchEvent（即View的dispatchTouchEvent）
    if (child == null) {
        handled = super.dispatchTouchEvent(transformedEvent);
    } else {
        // 转换事件坐标到子View的局部坐标系
        final float offsetX = mScrollX - child.mLeft;
        final float offsetY = mScrollY - child.mTop;
        transformedEvent.offsetLocation(offsetX, offsetY);
        if (! child.hasIdentityMatrix()) {
            transformedEvent.transform(child.getInverseMatrix());
        }
        // 调用子View的dispatchTouchEvent
        handled = child.dispatchTouchEvent(transformedEvent);
    }
    // ... 省略事件回收逻辑
    return handled;
}
```
## View.dispatchTouchEvent
ViewGroup的子View最终会调用View的dispatchTouchEvent，核心逻辑如下
```java
public boolean dispatchTouchEvent(MotionEvent event) {
    // ... 省略安全过滤、点击事件初始化等逻辑

    boolean result = false;
    // ... 省略无障碍服务相关处理

    if (onFilterTouchEventForSecurity(event)) {
        // 1. 优先触发OnTouchListener
        ListenerInfo li = mListenerInfo;
        if (li != null && li.mOnTouchListener != null
                && (mViewFlags & ENABLED_MASK) == ENABLED
                && li.mOnTouchListener.onTouch(this, event)) {
            result = true;
        }

        // 2. 若OnTouchListener未消费，调用onTouchEvent
        if (!result && onTouchEvent(event)) {
            result = true;
        }
    }

    // ... 省略后置处理逻辑
    return result;
}
```
## View.onTouchEvent
决定View是否消费事件的核心逻辑
```java
public boolean onTouchEvent(MotionEvent event) {
    final float x = event.getX();
    final float y = event.getY();
    final int viewFlags = mViewFlags;
    final int action = event.getAction();

    // 可点击性判断（clickable/longClickable/contextClickable）
    final boolean clickable = ((viewFlags & CLICKABLE) == CLICKABLE
            || (viewFlags & LONG_CLICKABLE) == LONG_CLICKABLE)
            || (viewFlags & CONTEXT_CLICKABLE) == CONTEXT_CLICKABLE;

    // 若View被禁用，直接返回clickable（禁用状态不消费，但可点击属性仍影响结果）
    if ((viewFlags & ENABLED_MASK) == DISABLED) {
        if (action == MotionEvent.ACTION_UP && (mPrivateFlags & PFLAG_PRESSED) != 0) {
            setPressed(false);
        }
        mPrivateFlags3 &= ~PFLAG3_FINGER_DOWN;
        return clickable;
    }

    // 若有TouchDelegate，委托处理
    if (mTouchDelegate != null) {
        if (mTouchDelegate.onTouchEvent(event)) {
            return true;
        }
    }

    if (clickable || (viewFlags & TOOLTIP) == TOOLTIP) {
        switch (action) {
            case MotionEvent.ACTION_UP:
                mPrivateFlags3 &= ~PFLAG3_FINGER_DOWN;
                if ((viewFlags & TOOLTIP) == TOOLTIP) {
                    handleTooltipUp();
                }
                if (!clickable) {
                    removeTapCallback();
                    removeLongPressCallback();
                    mInContextButtonPress = false;
                    mHasPerformedLongPress = false;
                    mIgnoreNextUpEvent = false;
                    break;
                }
                boolean prepressed = (mPrivateFlags & PFLAG_PREPRESSED) != 0;
                if ((mPrivateFlags & PFLAG_PRESSED) != 0 || prepressed) {
                    // ... 省略长按、点击回调逻辑
                    if (!mHasPerformedLongPress && !mIgnoreNextUpEvent) {
                        removeLongPressCallback();
                        // 触发OnClickListener
                        if (mPerformClick == null) {
                            mPerformClick = new PerformClick();
                        }
                        if (!post(mPerformClick)) {
                            performClickInternal(); // 最终调用onClick
                        }
                    }
                    // ... 省略其他UP事件处理
                }
                mIgnoreNextUpEvent = false;
                break;

            case MotionEvent.ACTION_DOWN:
                // ... 省略按下状态设置、长按回调初始化等逻辑
                break;

            case MotionEvent.ACTION_CANCEL:
                // ... 省略取消状态处理逻辑
                break;

            case MotionEvent.ACTION_MOVE:
                // ... 省略滑动判断、长按触发逻辑
                break;
        }
        return true; // 可点击View默认消费事件
    }

    return false; // 不可点击View返回false，不消费
}
```
onTouchEvent return true 消费事件，false 不消费

## 事件分发流程总结
1. Activity ->dispatchTouchEvent->调用PhoneWindow.superDispatchTouchEvent.
2. PhoneView->调用DecorView.superDispatchTouchEvent->触发
3. ViewGroup ->通过onInterceptTouchEvent判断是否拦截：  
    * 拦截：调用View.dispatchTouchEvent(实际调用)
    * 不拦截：调用子View的dispatchTouchEvent
    * 自定义时：
        * **拦截**时 onInterceptTouchEvent **return true**,
        * **不拦截**时 **return super.onInterceptTouchEvent(ev)**
4. View → dispatchTouchEvent优先触发OnTouchListener，未消费则调用onTouchEvent，最终决定是否消费事件。
5. **若子View不消费，事件回传给ViewGroup的onTouchEvent,再回传给Activity的onTouchEvent。onTouchEvent return true事件被消费** 


## 源码分析到这，自己实践验证一下。
```java

public class MyTextView extends androidx.appcompat.widget.AppCompatTextView {
  ...
  @Override
  public boolean onTouchEvent(MotionEvent event) {
      return super.onTouchEvent(event);
  }

  @Override
  public boolean dispatchTouchEvent(MotionEvent event) {
      MyLogUtil.d("tv dispatchTouchEvent action " + event.getAction());
      return super.dispatchTouchEvent(event);
  }
}
public class MyFrameLayout extends FrameLayout {
  @Override
  public boolean onInterceptTouchEvent(MotionEvent ev) {
      MyLogUtil.d("onInterceptTouchEvent" + ev.getAction() );
      return super.onInterceptTouchEvent(ev);
  }

  @Override
  public boolean onTouchEvent(MotionEvent event) {
      MyLogUtil.d("onTouchEvent" + event.getAction());
      return true;
  }
}
```
```xml
<com.hz.test.view.MyFrameLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/main"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <com.hz.test.view.MyTextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_gravity="center"
        android:text="Hello World!"
        android:textSize="24sp"/>

</com.hz.test.view.MyFrameLayout>
```
点击区域内时  
[MyLogUtil:d(L:63)] onInterceptTouchEvent0  
[MyLogUtil:d(L:63)] tv dispatchTouchEvent action 0  
[MyLogUtil:d(L:63)] onTouchEvent0  
[MyLogUtil:d(L:63)] onTouchEvent1  
滑动时
[MyLogUtil:d(L:63)] onInterceptTouchEvent0  
[MyLogUtil:d(L:63)] tv dispatchTouchEvent action 0  
[MyLogUtil:d(L:63)] onTouchEvent0  
[MyLogUtil:d(L:63)] onTouchEvent2  
[MyLogUtil:d(L:63)] onTouchEvent2  
[MyLogUtil:d(L:63)] onTouchEvent1  

点击区域外时
[MyLogUtil:d(L:63)] onInterceptTouchEvent0  
[MyLogUtil:d(L:63)] onTouchEvent0  
[MyLogUtil:d(L:63)] onTouchEvent1  

将 MyFrameLayout onInterceptTouchEvent改为
```java
@Override
public boolean onInterceptTouchEvent(MotionEvent ev) {
    int action = ev.getAction();
    if (action == MotionEvent.ACTION_MOVE) {
        MyLogUtil.d("onInterceptTouchEvent ACTION_MOVE" + ev.getAction() );
        return true;
    }
    MyLogUtil.d("onInterceptTouchEvent" + ev.getAction() );
    return super.onInterceptTouchEvent(ev);
}
```
区域内滑动时
[MyLogUtil:d(L:63)] onInterceptTouchEvent0 
[MyLogUtil:d(L:63)] tv dispatchTouchEvent action 0 
[MyLogUtil:d(L:63)] onTouchEvent0  
[MyLogUtil:d(L:63)] onTouchEvent2  
[MyLogUtil:d(L:63)] onTouchEvent2  
[MyLogUtil:d(L:63)] onTouchEvent1  


