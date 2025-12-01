---
title: 常用的adb命令
date: 2025-11-25
categories:
  - android
  - tool
tags:
  - android
  - tool
description: 记录一些常用的adb命令
---

# 记录一些常用的adb命令
    adb工具在 SDK platform-tools中, 命令来源为\system\core\toolbox、\frameworks\base\cmds

### 一、基础准备与设备连接
#### 1. 检查 ADB 是否生效
```bash
adb version  # 查看 ADB 版本（验证环境配置成功）
adb devices  # 列出已连接的设备/模拟器（核心命令）
# 输出格式：设备ID + 状态（device=已连接，offline=离线，unauthorized=未授权）
```
#### 2. 设备授权与连接
- 首次连接设备：开启手机「开发者选项」→ 启用「USB 调试」，连接电脑后在手机上确认授权。
- 无线连接（无需数据线）：
  ```bash
  adb tcpip 5555  # 让设备监听 5555 端口（需先通过USB连接一次）
  adb connect 192.168.1.100:5555  # 替换为设备IP（手机WiFi与电脑同网段）
  adb disconnect 192.168.1.100:5555  # 断开无线连接
  ```
#### 3. 多设备/模拟器切换
如果连接多个设备，命令前需加 `-s 设备ID` 指定目标：
```bash
adb -s 123456 devices  # 仅查看设备123456的状态
adb -s emulator-5554 install app.apk  # 给模拟器5554安装APP（-r覆盖安装）
```


### 二、文件传输（设备 ↔ 电脑）
#### 1. 电脑 → 设备（推送文件）
```bash
adb push 本地文件路径 设备路径
# 示例：
adb push D:\test.txt /sdcard/  # 推送本地文件到设备存储卡根目录
adb push D:\app.apk /data/local/tmp/  # 推送APK到设备临时目录
```
#### 2. 设备 → 电脑（拉取文件）
```bash
adb pull 设备文件路径 本地保存路径
# 示例：
adb pull /sdcard/DCIM/Camera/1.jpg D:\Pictures\  # 拉取设备照片到电脑
adb pull /data/data/com.example.app/logs/ D:\logs\  # 拉取APP日志目录（需root）
```
> 注意：访问 `/data/data/` 等系统目录需设备 **root**，否则会提示权限不足。


### 三、应用管理（安装/卸载/启动/停止）
#### 1. 安装 APK
```bash
adb install 本地APK路径  # 普通安装
adb install -r 本地APK路径  # 覆盖安装（保留数据）
adb install -s 本地APK路径  # 安装到SD卡（仅支持部分APP）
adb install -d 本地APK路径  # 允许降级安装（低版本覆盖高版本）
```
#### 2. 卸载应用
```bash
adb uninstall 应用包名  # 彻底卸载（删除数据）
adb uninstall -k 应用包名  # 保留数据卸载（仅删除APK）
# 示例：卸载微信（包名com.tencent.mm）
adb uninstall com.tencent.mm
```
#### 3. 查看已安装应用包名
```bash
adb shell pm list packages  # 列出所有应用包名（系统+第三方）
adb shell pm list packages -3  # 仅列出第三方应用（常用）
adb shell pm list packages | grep tencent  # 过滤包含"tencent"的应用（需Windows PowerShell或Linux/Mac终端）
```
#### 4. 启动/停止应用
```bash
# 启动应用（需知道应用的启动Activity，可通过aapt工具获取）
adb shell am start -n 应用包名/启动Activity
# 示例：启动微信主页面
adb shell am start -n com.tencent.mm/com.tencent.mm.ui.LauncherUI

# 强制停止应用（类似手动划掉后台）
adb shell am force-stop 应用包名
adb shell am force-stop com.tencent.mm  # 停止微信
```


### 四、设备控制与系统操作
#### 1. 重启设备
```bash
adb reboot  # 正常重启
adb reboot recovery  # 重启进入Recovery模式
adb reboot bootloader  # 重启进入Fastboot模式（刷机常用）
```
#### 2. 屏幕操作（模拟用户输入）
```bash
adb shell input tap 500 1000  # 点击屏幕坐标(500,1000)（需知道屏幕分辨率）
adb shell input swipe 300 1500 300 500 1000  # 从(300,1500)滑动到(300,500)，耗时1000ms（下拉通知栏）
adb shell input text "hello"  # 输入文本（不支持特殊字符，需转义）
adb shell input keyevent 3  # 按下Home键（keyevent对应按键码，3=Home，4=返回，26=电源）
```
#### 3. 查看设备信息
```bash
adb shell getprop ro.product.model  # 查看设备型号（如Xiaomi 13）
adb shell getprop ro.build.version.release  # 查看Android系统版本（如14）
adb shell wm size  # 查看屏幕分辨率（如1080x2400）
adb shell df  # 查看设备存储占用
```
#### 4. 清除应用数据/缓存
```bash
adb shell pm clear 应用包名  # 清除应用所有数据（等同于「设置→应用→清除数据」）
adb shell pm clear com.tencent.mm  # 清除微信数据（需重新登录）
```


### 五、调试与日志查看
#### 1. 查看实时日志（核心调试命令）
```bash
adb logcat  # 输出所有日志（刷屏快，不推荐直接用）
adb logcat -s TAG名称  # 过滤指定TAG的日志（如只看APP的自定义日志）
adb logcat *:E  # 只显示错误级别（Error）日志
adb logcat > D:\log.txt  # 保存日志到电脑本地文件
```
#### 2. 查看进程信息
```bash
adb shell ps  # 列出所有运行中的进程
adb shell ps | grep 应用包名  # 查看指定APP的进程状态（如微信）
adb shell ps | grep com.tencent.mm
```
#### 3. 查看CPU/内存占用
```bash
adb shell top  # 实时查看系统资源占用（类似电脑任务管理器）
adb shell top -n 1 | grep 应用包名  # 查看一次指定APP的CPU/内存占用
```

#### 4. 获取anr文件
```bash
adb pull /data/anr  D:\
# 生成报告并保存到电脑本地（格式为 zip 压缩包）
adb bugreport D:\android_bugreport.zip
```


### 六、高级功能（需Root/特殊权限）
#### 1. 进入设备Shell（直接操作设备系统）
```bash
adb shell  # 进入普通Shell（权限有限）
su  # 切换到root用户（需设备已Root，命令行前缀变为#）
exit  # 退出Shell
```
#### 2. 挂载系统分区为可写（修改系统文件用）
```bash
adb root  # 以root权限重启ADB（需设备Root）
adb remount  # 挂载/system分区为可写（默认只读）
```
#### 3. 备份/恢复应用数据（需Root）
```bash
# 备份应用数据到设备（.ab格式）
adb backup -noapk 应用包名 -f /sdcard/backup.ab
# 从电脑恢复备份
adb restore D:\backup.ab
```


### 常用辅助工具
- **获取应用包名/启动Activity**：
  1. 安装APK后执行：`adb shell dumpsys window | grep mCurrentFocus`（当前前台APP的包名+Activity）
  2. 用 `aapt dump badging 本地APK路径`（需配置aapt环境，输出中找 `package: name=` 和 `launchable-activity: name=`）
- **屏幕截图/录屏**：
  ```bash
  adb shell screencap /sdcard/screenshot.png  # 截图保存到设备
  adb pull /sdcard/screenshot.png D:\  # 拉取截图到电脑
  adb shell screenrecord /sdcard/record.mp4  # 录屏（按Ctrl+C停止，默认180秒）
  ```


### 注意事项
1. 执行命令前需确保设备已连接（`adb devices` 能看到设备，状态为 `device`）。
2. 部分命令（如访问系统目录、清除系统应用数据）需设备 **Root**，否则会提示 `permission denied`。
3. 无线连接时，设备与电脑需在同一WiFi，且设备IP可通过「设置→WLAN→已连接WiFi→详情」查看。


