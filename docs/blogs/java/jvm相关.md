---
title: jvm相关
date: 2025-12-15
categories:
  - java
tags:
  - java
  - jvm
---

# JVM

## JVM 运行时数据区

**JVM 运行时数据区**是 JVM 规范定义的内存划分，不同 JDK 版本（如 JDK 8 及以上）的划分略有调整（核心变化是移除永久代、引入元空间），**主流 JDK 8+ 标准划分包含 5 大核心区域**，以下结合功能、存储内容和核心特点详细说明：

### 一、JVM 运行时数据区（JDK 8+ 核心划分）
| 区域名称               | 线程私有/共享 | 核心功能                                                                 | 存储内容                                                                 | 关键特点                                                                 |
|------------------------|---------------|--------------------------------------------------------------------------|--------------------------------------------------------------------------|--------------------------------------------------------------------------|
| **程序计数器（PC Register）** | 线程私有      | 记录当前线程执行的字节码指令地址（行号），是 JVM 中唯一不会 OOM 的区域    | 1. 执行 Java 方法：存储字节码指令的偏移量；<br>2. 执行 Native 方法：值为 undefined | 1. 线程切换后能恢复到正确执行位置；<br>2. 无 OOM/StackOverflowError 异常 |
| **Java 虚拟机栈（JVM Stack）** | 线程私有      | 支撑 Java 方法的调用和执行，每个方法对应一个「栈帧」                      | 栈帧（包含局部变量表、操作数栈、动态链接、方法返回地址等）               | 1. 局部变量表存储基本类型、对象引用、returnAddress 类型；<br>2. 栈深度溢出抛 StackOverflowError；<br>3. 栈扩展失败抛 OutOfMemoryError |
| **本地方法栈（Native Method Stack）** | 线程私有      | 支撑 Native 方法（如 C/C++ 实现的方法）的调用和执行                      | 本地方法执行的相关数据（与虚拟机栈逻辑类似，但针对 Native 方法）         | 1. HotSpot 虚拟机将其与虚拟机栈合并实现；<br>2. 同样会抛 StackOverflowError/OOM |
| **Java 堆（Heap）**          | 线程共享      | JVM 最大的内存区域，唯一目的是存储对象实例和数组，是 GC（垃圾回收）的核心区域 | 所有通过 `new` 创建的对象实例、数组（对象的元数据存元空间，实例存堆）    | 1. 可通过 `-Xms`（初始堆）、`-Xmx`（最大堆）配置大小；<br>2. 堆内存不足抛 OutOfMemoryError；<br>3. 细分：新生代（Eden + Survivor 0/1）、老年代 |
| **方法区（Method Area）**    | 线程共享      | 存储类的元数据、常量、静态变量、即时编译器编译后的代码等                | 1. 类的结构信息（版本、字段、方法、接口）；<br>2. 运行时常量池；<br>3. 静态变量、JIT 编译后的代码 | 1. JDK 8 前用「永久代」实现，JDK 8+ 用「元空间（Metaspace）」替代（元空间直接使用本地内存）；<br>2. 内存不足抛 OutOfMemoryError（元空间溢出为 Metaspace OOM） |

### 二、关键补充（易混淆概念）
#### 1. 运行时常量池（Runtime Constant Pool）
属于**方法区的一部分**，存储编译期生成的字面量（如字符串常量）、符号引用，以及运行时动态生成的常量（如 `String.intern()` 生成的常量）。

#### 2. 元空间（Metaspace）vs 永久代（PermGen）
- **永久代（JDK 7 及以前）**：是方法区的实现方式，属于 JVM 堆的一部分，大小受 `-XX:PermSize`/`-XX:MaxPermSize` 限制，容易触发 OOM；
- **元空间（JDK 8+）**：替代永久代实现方法区，直接使用操作系统的本地内存，默认无上限（可通过 `-XX:MetaspaceSize`/`-XX:MaxMetaspaceSize` 限制），大幅减少 OOM 概率。

#### 3. 直接内存（Direct Memory）
**不属于 JVM 规范定义的运行时数据区**，但常被关联提及：
- 是堆外内存（操作系统内存），通过 `ByteBuffer.allocateDirect()` 分配；
- 不受 JVM 堆大小限制，但受物理内存总大小限制，也会触发 OOM；
- NIO 框架常用直接内存提升 IO 性能（减少堆内存与堆外内存的拷贝）。

### 三、核心记忆要点（JDK 8+）
1. **线程私有 3 区**：程序计数器、虚拟机栈、本地方法栈；
2. **线程共享 2 区**：Java 堆、方法区（元空间实现）；
3. **OOM 例外**：仅程序计数器不会抛出 OutOfMemoryError；
4. **GC 核心区**：Java 堆是垃圾回收的主要区域（方法区/元空间也有 GC，但频率极低）。


## 类加载的方式         

* 命令行启动应用时候由JVM初始化加载

* 通过Class.forName（）方法动态加载

* 通过ClassLoader.loadClass（）方法动态加载     

##  JAVA 的类加载器：
AppClassLoader -> ExtClassLoader -> BootStrap ClassLoad     
继承 AppClassLoader ,ExtClassLoader->URLClassLoader->SecureClassLoad->ClassLoader

## 类加载过程       
加载-》连接-》初始化        
加载：将JAVA直接秒数据加载到JVM内存当中，并映射成JVM认可的数据结构      
连接：   
        1验证，     
        2准备，创建类或接口的静态变量，并赋初始值，半初始状态，     
        3.解析，符号转直接引用，栈初始化指针-映射堆引用地址，       
初始化      

##  创建到清除  

1. 创建一个对象，JVM方法区找对象类型，然后创建对象
2. JVM 实例化对象，堆创建对象-半初始化
3. 对象手写分配堆内存新生代Eden，经过异常MinorGc,存活转S1，每次存活S1.S2来回拷贝，移动一次，年龄+1,15之后老年区，因为 4字节 
4. 方法执行结束，栈指针先移除
5. 堆中对象，经过Full GC ，标记垃圾，被GC清理

不一定堆中，为了优化可能放栈中，生命周期简单，不用GC        

## 垃圾回收

### 确定是否垃圾        

1. 引用计数，引用个数为0-》垃圾
2. 根可达算法，GC Root找引用，找不到-》垃圾     

GC Root ：      
* Stack->JVM Stack ,Native Stack,class 类,
* run-time constant pool 常量池 
* static reference 静态变量

### JVM 垃圾回收算法
MarkSweep 标记清除算法-》内存碎片
Copying 拷贝算法-> 内存浪费，一半内存，效率和存活个数相关
MarkCompack 标记压缩算法-》标记后，将存活往一端移