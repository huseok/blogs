---
title: Android 日志相关
date: 2025-12-1
categories:
  - android
  - tool
tags:
  - android
  - tool
description: 记录一些日志相关信息。
---

# Android 日志相关

在Android系统中，日志体系并非仅针对输入事件，而是从**系统层级**和**功能分类**两个维度划分，同时输入事件相关日志会归属到特定日志类别中。

## 一、Android官方定义的日志级别（按优先级）
Android的`Log`类定义了**6种日志级别**（从低到高），用于标记日志的重要程度，开发中通过`Log.xxx()`方法输出，系统会根据级别过滤日志：
1. **Verbose（V）**：最详细的日志，用于调试过程中的临时信息，优先级最低，如打印变量值、方法执行流程。
2. **Debug（D）**：调试日志，用于开发阶段的调试信息，发布时通常会关闭，如打印接口请求参数、方法调用结果。
3. **Info（I）**：普通信息日志，用于记录应用的正常运行状态，如应用启动完成、初始化成功等关键节点。
4. **Warning（W）**：警告日志，用于记录潜在的问题（不会导致程序崩溃），如参数不合法、资源使用不当等。
5. **Error（E）**：错误日志，用于记录程序运行中的错误（可能导致功能异常），如空指针异常、IO错误等。
6. **Assert（A）**：断言日志，用于记录严重错误（会直接导致应用崩溃），通常用于调试阶段验证条件是否成立，发布版本中一般不使用。

## 二、按系统模块/功能的日志分类（含输入事件）
Android系统底层和框架层会按**功能模块**输出日志，输入事件相关日志属于其中特定类别，核心模块分类如下：
1. **输入事件日志**
    输入事件（触摸、按键、传感器等）的日志主要由**InputManagerService（IMS）** 和底层输入子系统输出，归属到：
    - **事件原始日志**：由`/dev/input`设备节点输出，记录原始输入事件（如触摸坐标、按键码），可通过`getevent`命令查看。
    - **框架层输入日志**：在`frameworks/base/services/core/java/com/android/server/input/InputManagerService.java`中，通过`Log.d/I/W`输出输入事件的分发、处理日志，标签通常为`InputManager`或`InputDispatcher`。
    - **按键/触摸事件日志**：系统会用`KeyEvent`/`MotionEvent`相关标签记录事件传递，如Activity的事件分发日志会标记为`ViewRootImpl`。
2. **系统服务日志**
    如ActivityManager（AM）、PackageManager（PM）、WindowManager（WM）等核心服务的日志，标签通常为`ActivityManager`、`PackageManager`，记录应用启动、组件生命周期、窗口管理等关键流程。
3. **应用日志**
    开发者在应用中通过`Log`类输出的自定义日志，标签由开发者指定（如`MainActivity`、`NetworkUtil`），包含业务逻辑、调试信息等。
4. **内核日志（dmesg）**
    由Linux内核输出，记录硬件驱动、内核初始化、进程调度等底层信息，可通过`dmesg`命令查看，用于调试系统底层问题（如硬件适配、内核崩溃）。
5. **崩溃日志（Tombstone）**
    应用崩溃时系统生成的详细日志，包含堆栈信息、进程状态等，存储在`/data/tombstones/`目录，用于分析ANR、Crash原因。
6. **Radio日志**
    与通信相关的日志，记录手机信号、通话、移动网络（2G/3G/4G/5G）、WiFi、蓝牙等模块的运行状态，标签通常为`Radio`、`Telephony`。
7. **GPU/图形日志**
    记录SurfaceFlinger、OpenGL ES、渲染管线的日志，标签如`SurfaceFlinger`、`EGL`，用于调试UI渲染、卡顿问题。

## 三、Android核心日志工具与日志输出位置
1. **logcat**：最常用的日志工具，可查看应用和框架层的日志，支持按级别、标签、进程过滤（如`logcat -s InputManager`仅查看输入事件日志）。
2. **dmesg**：查看内核日志。
3. **systrace**：整合了系统各模块的日志（含输入事件、CPU调度、UI渲染），用于分析性能问题。
4. **日志存储**：
    - 应用/框架日志：实时输出到内存，可通过logcat实时查看，也可通过`logcat -d > /sdcard/log.txt`保存到文件。
    - 内核日志：存储在`/proc/kmsg`。
    - 崩溃日志：存储在`/data/tombstones/`（需root权限）。

## 面试回答思路
可按“**日志级别→功能分类（重点讲输入事件日志）→核心工具**”的逻辑组织语言，例如：
“Android的日志主要分为两类维度：一是官方定义的日志级别，二是按系统功能模块的分类。

首先，按优先级划分的日志级别有6种，从低到高是Verbose、Debug、Info、Warning、Error、Assert，分别用于调试、信息记录、错误提示等场景。

其次，按功能模块分类的话，核心包括输入事件日志、系统服务日志、应用日志、内核日志等。其中输入事件日志比较特殊，底层由InputManagerService负责，会记录触摸、按键的原始事件和分发流程，可通过logcat过滤InputManager标签查看；而应用日志是开发者自定义的，内核日志则用于调试底层硬件问题。

最后，查看这些日志的核心工具是logcat，针对输入事件还可以用getevent命令看原始事件，分析性能问题则用systrace整合日志。”

### 加分点
可补充“输入事件日志的调试场景”，比如当触摸无响应时，可通过`logcat -s InputDispatcher`查看事件是否被正确分发，或用`getevent`验证硬件输入是否正常，体现实际应用经验。

以下是Android输入事件日志调试的常用命令清单，涵盖**原始事件查看、框架层日志过滤、系统状态分析**等场景，面试或开发中可直接使用：


##Android 输入事件日志调试的常用命令清单

### 一、查看原始输入事件（底层硬件事件）
1. **实时监控所有输入设备事件**  
   ```bash
   getevent
   ```  
   - 输出示例：触摸事件会显示设备节点（如`/dev/input/event2`）、事件类型（`EV_ABS`为绝对坐标）、坐标值（`ABS_MT_POSITION_X/Y`）；按键事件显示`EV_KEY`和按键码（如`KEY_POWER`）。  
   - 用途：验证硬件输入是否正常（如触摸屏是否上报坐标、按键是否被识别）。

2. **指定输入设备监控**  
   ```bash
   getevent /dev/input/event2  # 仅监控event2设备（通常为触摸屏）
   ```

3. **显示事件名称（更易读）**  
   ```bash
   getevent -l
   ```  
   - 将十六进制事件类型/编码转为可读名称（如`ABS_MT_POSITION_X`代替`0035`）。

4. **查看输入设备列表及属性**  
   ```bash
   getevent -p
   ```  
   - 列出所有输入设备的支持事件类型、按键码范围、坐标范围（如触摸屏的X/Y轴最大值）。


### 二、过滤框架层输入事件日志（logcat）
1. **监控InputManagerService相关日志**  
   ```bash
   logcat -s InputManager:V InputDispatcher:V  # V表示Verbose级别，输出详细日志
   ```  
   - 标签说明：  
     - `InputManager`：输入事件的初始化、设备连接日志；  
     - `InputDispatcher`：事件分发流程（如事件发给哪个窗口、是否被拦截）。  
   - 用途：分析事件从底层到应用的分发过程（如触摸无响应时排查是否分发失败）。

2. **监控View事件分发日志**  
   ```bash
   logcat -s ViewRootImpl:V TouchEvent:V
   ```  
   - `ViewRootImpl`：记录事件传递到Activity/View的过程；  
   - 自定义标签`TouchEvent`：若应用中在onTouchEvent中添加`Log.d("TouchEvent", ...)`，可过滤应用内事件处理日志。

3. **监控按键事件**  
   ```bash
   logcat -s KeyEvent:V
   ```  
   - 查看按键事件的传递（如Home键、返回键的处理）。

4. **过滤ANR相关输入超时日志**  
   ```bash
   logcat -s ActivityManager:I InputDispatcher:E
   ```  
   - 当输入事件超时触发ANR时，`ActivityManager`会输出ANR原因，`InputDispatcher`会标记事件超时。


### 三、输入事件性能分析
1. **使用systrace追踪输入事件流程**  
   ```bash
   systrace.py input view -o input_trace.html  # 抓取输入和视图系统的trace
   ```  
   - 用Chrome打开`input_trace.html`，可查看：  
     - 输入事件从内核到InputDispatcher的耗时；  
     - 事件从Dispatcher到应用View的处理耗时；  
     - 识别卡顿环节（如事件处理超过16ms导致掉帧）。

2. **查看输入事件队列状态**  
   ```bash
   dumpsys input
   ```  
   - 输出输入管理器的状态：  
     - 已连接的输入设备；  
     - 事件队列长度（若队列堆积，说明事件处理阻塞）；  
     - 当前焦点窗口（验证事件是否发给正确窗口）。


### 四、其他辅助命令
1. **模拟输入事件（调试用）**  
   ```bash
   sendevent /dev/input/event2 0 3 53 100  # 模拟X轴坐标100
   sendevent /dev/input/event2 0 3 54 200  # 模拟Y轴坐标200
   input tap 100 200  # 模拟触摸点击（更易用）
   input keyevent KEYCODE_BACK  # 模拟返回键
   ```  
   - 用途：验证应用对输入事件的响应是否正常。

2. **查看当前焦点应用**  
   ```bash
   dumpsys window | grep mCurrentFocus
   ```  
   - 确认输入事件应分发的目标应用，排查焦点错误导致的事件无响应。
