---
title: Android systrace
date: 2025-12-15
categories:
  - android
  - systrace
tags:
  - android
  - systrace
description: systrace
---

# Perfetto 
[Perfetto UI在线可视化工具](https://ui.perfetto.dev/)

adb push C:\Users\seok\Desktop\perfetto.pbtx /data/local/tmp/perfetto.pbtxt   
adb shell 'cat /data/local/tmp/perfetto.pbtxt | perfetto --txt -c - -o /data/misc/perfetto-traces/trace'     
adb shell 'perfetto --attach=perf_debug --stop'   
adb pull /data/misc/perfetto-traces/trace f://adb   

```
//1. 首先执行命令
adb shell perfetto -o /data/misc/perfetto-traces/trace_file.perfetto-trace -t 20s \ sched freq idle am wm gfx view binder_driver hal dalvik camera input res memory

// 2. 操作手机，复现场景，比如滑动或者启动等

// 3. 将 trace 文件 pull 到本地
adb pull /data/misc/perfetto-traces/trace_file.perfetto-trace
```

或者web或者手机上直接操作

配置文件可在网站生成    


## 常用关键词
deliverinput 看input事件，
transition看窗口变换，
focusedapp看当前焦点应用，
animator看动画，
vysnc-app看应用垂直刷新的信号。看是否卡顿，看帧的绘制主线程是否超过了16ms，RenderThread是否超时。
看SurfaceFlinger的帧绘制是否连续。



[详细学习地址](https://www.androidperformance.com/)