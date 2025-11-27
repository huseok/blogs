---
title: LinearLayout 源码分析
date: 2025-11-25
categories:
  - android
  - 源码分析
tags:
  - android
  - 源码分析
---


# LinearLayout 源码分析

View 和 ViewGroup 主要是 测量（onMeasure）、布局（onLayout）、绘制（onDraw）核心流程，View分析时也主要按照这个步骤来分析。

测量模式有三种：

* UNSPECIFIED：父控件对子控件无约束，特殊模式，如滚动

* Exactly：精确模式，父容器已经确定了当前 View 的精确大小,如直接指定200dp

* AT_MOST：子控件为wrap_content的时候，测量值为AT_MOST,尺寸值就是父容器剩余的可用宽度。

## 一 、核心流程：测量（`onMeasure`）

```     java
@Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        if (mOrientation == VERTICAL) {
            measureVertical(widthMeasureSpec, heightMeasureSpec);
        } else {
            measureHorizontal(widthMeasureSpec, heightMeasureSpec);
        }
    }
```

分为measureVertical 和measureHorizontal ，后续都以vertical来分析

### 1.1 第一次遍历，初步测量

```  java 
    void measureVertical(int widthMeasureSpec, int heightMeasureSpec) {
             // 一些重要的变量
        mTotalLength = 0;            // 所有 childView 的高度和 + 本身的 padding，
        int maxWidth = 0;            // 所有 childView 中宽度的最大值
        int childState = 0;
        int alternativeMaxWidth = 0;    // 所有 layout_weight <= 0 的 childView 中宽度的最大值
        int weightedMaxWidth = 0;       // 所有 layout_weight >0 的 childView 中宽度的最大值
        boolean allFillParent = true;
        float totalWeight = 0;          // 所有 childView 的 weight 之和
        ......
        final int count = getVirtualChildCount();
        ......
        // See how tall everyone is. Also remember max width.
        for (int i = 0; i < count; ++i) {
          ......
          final LayoutParams lp = (LayoutParams) child.getLayoutParams();
            // 计算总权重 totalWeight
          totalWeight += lp.weight;
          ......
          final boolean useExcessSpace = lp.height == 0 && lp.weight > 0;//正常写weight时
          if (heightMode == MeasureSpec.EXACTLY && useExcessSpace) {
              // 不测量仅使用多余空间布局的子视图。这些视图将在稍后进行测量
              final int totalLength = mTotalLength;
              mTotalLength = Math.max(totalLength, totalLength + lp.topMargin + lp.bottomMargin);
              skippedMeasure = true;//跳过测量，后续重新测量
          } else {
              if (useExcessSpace) { 
                // 将子View的高度设置为WRAP_CONTENT，以便测量其最佳高度
                lp.height = LayoutParams.WRAP_CONTENT;
              }
              final int usedHeight = totalWeight == 0 ? mTotalLength : 0;
              //测量子 View 前面设置为WRAP_CONTENT了，计算每个 childView 的大小,ViewGroup :measureChildWithMargins->view measure
              measureChildBeforeLayout(child, i, widthMeasureSpec, 0,
              heightMeasureSpec, usedHeight);

              final int childHeight = child.getMeasuredHeight();

              if (useExcessSpace) {
                  // 恢复原始高度并记录分配给多余子View的空间
                  lp.height = 0;
                  consumedExcessSpace += childHeight;
              }

              final int totalLength = mTotalLength;
              mTotalLength = Math.max(totalLength, totalLength + childHeight + lp.topMargin +
                    lp.bottomMargin + getNextLocationOffset(child));
              
              //当设置了useLargestChild,记录最大item高度，
              if (useLargestChild) {
                  largestChildHeight = Math.max(childHeight, largestChildHeight);
              }
          }
          // 处理基线、宽度等
          ......
      }
```

初步测量每个子 View ，同时统计关键信息，如总权重totalWeight、已使用的总长度mTotalLength等
**measureChildBeforeLayout()** 测量子 View 前面设置为WRAP_CONTENT了，计算每个 childView 的大小,ViewGroup :measureChildWithMargins->view measure

### 1.2 第二次遍历，特殊情况处理

``` java
if (useLargestChild &&
        (heightMode == MeasureSpec.AT_MOST || heightMode == MeasureSpec.UNSPECIFIED)) {
    mTotalLength = 0;
    for (int i = 0; i < count; ++i) {
      ......
      final int totalLength = mTotalLength;
      //用来计算mTotalLength，实际未设置weight的高度不会受影响，但是如果父view设置wrap_content会导致整体变高
      mTotalLength = Math.max(totalLength, totalLength + largestChildHeight +
      lp.topMargin + lp.bottomMargin + getNextLocationOffset(child));
    }
}
```

二次遍历的触发条件是useLargestChild为true，并且高度模式为AT_MOST或UNSPECIFIED，此时 LinearLayout 的高度是不确定的，可能需要根据最大子 View 的高度来重新计算总高度。

### 1.3 第三次遍历，权重分配与调整

``` java
mTotalLength += mPaddingTop + mPaddingBottom;
int heightSize = mTotalLength;
// Check against our minimum height(getSuggestedMinimumHeight最小高度)
heightSize = Math.max(heightSize, getSuggestedMinimumHeight());
// Reconcile our calculated size with the heightMeasureSpec
int heightSizeAndState = resolveSizeAndState(heightSize, heightMeasureSpec, 0);
heightSize = heightSizeAndState & MEASURED_SIZE_MASK;
//可分配空间remainingExcess，consumedExcessSpace分配给多余子View的空间
int remainingExcess = heightSize - mTotalLength
                + (mAllowInconsistentMeasurement ? 0 : consumedExcessSpace);

//之前跳过测量的，或需要重新测量子view，或存在可分配空间，且totalWeight>0
if (skippedMeasure
    || ((sRemeasureWeightedChildren || remainingExcess != 0) && totalWeight > 0.0f)) {
  //权重总和、
  float remainingWeightSum = mWeightSum > 0.0f ? mWeightSum : totalWeight;
  mTotalLength = 0;
  for (int i = 0; i < count; ++i) {
    ......
    if (childWeight > 0) {
      //计算子view分配空间
      final int share = (int) (childWeight * remainingExcess / remainingWeightSum);
      remainingExcess -= share;
      remainingWeightSum -= childWeight;
      final int childHeight;
      if (mUseLargestChild && heightMode!= MeasureSpec.EXACTLY) {
          childHeight = largestChildHeight;//最高子view高度
      } else if (lp.height == 0 && (!mAllowInconsistentMeasurement 
          || heightMode == MeasureSpec.EXACTLY)) {
          // 子View仅使用其分配的剩余空间进行布局
          childHeight = share;
      } else {
          // 子View在其固有高度基础上加上分配的剩余空间（同时设置了weight和height!=0)
          childHeight = child.getMeasuredHeight() + share;
      }
      final int childHeightMeasureSpec = MeasureSpec.makeMeasureSpec(
      Math.max(0, childHeight), MeasureSpec.EXACTLY);
      final int childWidthMeasureSpec = getChildMeasureSpec(widthMeasureSpec,
              mPaddingLeft + mPaddingRight + lp.leftMargin + lp.rightMargin,
              lp.width);
      child.measure(childWidthMeasureSpec, childHeightMeasureSpec);
      // Child may now not fit in vertical dimension.
      childState = combineMeasuredStates(childState, child.getMeasuredState()
              & (MEASURED_STATE_MASK>>MEASURED_HEIGHT_STATE_SHIFT));
    }
    
      //后续MaxWidth等逻辑
      ......
  }
......
} else {
  // We have no limit, so make all weighted views as tall as the largest child.
  // Children will have already been measured once.
  if (useLargestChild && heightMode != MeasureSpec.EXACTLY) {
    for (int i = 0; i < count; i++) {
      ......
      //设置useLargestChild且weight>0,将高度设置为最高子view
      float childExtra = lp.weight;
      if (childExtra > 0) {
         child.measure(
                MeasureSpec.makeMeasureSpec(child.getMeasuredWidth(),
                        MeasureSpec.EXACTLY),
                MeasureSpec.makeMeasureSpec(largestChildHeight,
                        MeasureSpec.EXACTLY));
      }
    }
  }
}
```
### 1.4 自定义view等测量流程的最终方法 setMeasuredDimension
    将计算好的「最终宽高」存入 View 内部，标记测量流程完成。未调用会抛异常崩溃
``` java
setMeasuredDimension(
  resolveSizeAndState(maxWidth, widthMeasureSpec, childState),heightSizeAndState);

//view中方法
protected final void setMeasuredDimension(int measuredWidth, int measuredHeight) {
  boolean optical = isLayoutModeOptical(this);
  if (optical != isLayoutModeOptical(mParent)) {
      Insets insets = getOpticalInsets();
      int opticalWidth  = insets.left + insets.right;
      int opticalHeight = insets.top  + insets.bottom;

      measuredWidth  += optical ? opticalWidth  : -opticalWidth;
      measuredHeight += optical ? opticalHeight : -opticalHeight;
  }
  setMeasuredDimensionRaw(measuredWidth, measuredHeight);
}
private void setMeasuredDimensionRaw(int measuredWidth, int measuredHeight) {
  mMeasuredWidth = measuredWidth;
  mMeasuredHeight = measuredHeight;

  mPrivateFlags |= PFLAG_MEASURED_DIMENSION_SET;
}

```

## 二 、核心流程：布局（`onLayout`）

分为layoutVertical(l, t, r, b)和layoutHorizontal(l, t, r, b)，依旧以vertical分析 

### 2.1 layoutVertical 分析
```  java
void layoutVertical(int left, int top, int right, int bottom) {
  ......
  //根据gravity确定位置
  final int majorGravity = mGravity & Gravity.VERTICAL_GRAVITY_MASK;
  final int minorGravity = mGravity & Gravity.RELATIVE_HORIZONTAL_GRAVITY_MASK;
  switch (majorGravity) {
      case Gravity.BOTTOM:
          // mTotalLength contains the padding already
          childTop = mPaddingTop + bottom - top - mTotalLength;
          break;
          // mTotalLength contains the padding already
      case Gravity.CENTER_VERTICAL:
          childTop = mPaddingTop + (bottom - top - mTotalLength) / 2;
          break;
      case Gravity.TOP:
      default:
          childTop = mPaddingTop;
          break;
  } 
  for (int i = 0; i < count; i++) {
      final View child = getVirtualChildAt(i);
      if (child == null) {
          childTop += measureNullChild(i);
      } else if (child.getVisibility() != GONE) {
          ......
          final int layoutDirection = getLayoutDirection();
          final int absoluteGravity = Gravity.getAbsoluteGravity(gravity, layoutDirection);
          switch (absoluteGravity & Gravity.HORIZONTAL_GRAVITY_MASK) {
            ......
          }
          ......
          setChildFrame(child, childLeft, childTop + getLocationOffset(child),
                  childWidth, childHeight);
          childTop += childHeight + lp.bottomMargin + getNextLocationOffset(child);
          ......
        }
  }

}

private void setChildFrame(View child, int left, int top, int width, int height) {
  //调用view的layout方法
  child.layout(left, top, left + width, top + height);
}
    
```




## 三 、核心流程：绘制（`onDraw`）

### 3.1 onDraw里主要是绘制分割线
```   java
@Override
protected void onDraw(Canvas canvas) {
    if (mDivider == null) {
        return;
    }

    if (mOrientation == VERTICAL) {
        drawDividersVertical(canvas);
    } else {
        drawDividersHorizontal(canvas);
    }
}
```
