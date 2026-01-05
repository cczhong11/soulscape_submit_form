

一、整体结构（你只需要建 5 个表）🧩

在 同一个多维表格空间 里建👇

📌 表 1：Applications（申请主表）【核心】

这是所有申请的“中枢神经”

字段名	类型	说明
Application ID	自动编号	主键
Track	单选	Visionary / Mentor
Status	单选	Submitted / Reviewing / Accepted / Rejected
Created At	创建时间	自动
Reviewer	成员	谁在看
Reviewer Notes	多行文本	内部备注

✨ 这个表 = 你未来的审核后台

⸻

📌 表 2：Visionary Applications

只存 Visionary 的字段 👑

字段名	类型
Application	关联 Applications
Full Name	文本
Title / Role	文本
Professional Link	链接
Headshot	附件
Role Selection	单选（Juror / Advisor）
SF Availability	单选（Yes / No / Maybe）
Soul over Slop	多行文本

💡 关键点
	•	用「关联字段」连到 Applications
	•	SF Availability 可以设置成 仅在 Role = Juror 时显示

⸻

📌 表 3：Mentor Applications

玩家路线 🎮

字段名	类型
Application	关联 Applications
Handle	文本
Primary Platform	单选
Follower Count	数字
Portfolio Link	链接
Superpower	单选
Mission Card	单选
Proud Work Link	链接


⸻

📌 表 4：Tools（工具库）

先建好一堆工具标签 🧰

Tool Name
Midjourney
Runway
Luma
Sora
ChatGPT
ComfyUI
Pika


⸻

📌 表 5：Mentor ↔ Tools（中间表）

实现 多选工具 的关键 😼✨

Mentor Application	Tool
关联 Mentor Applications	关联 Tools

👉 这一步非常工程思维，你已经在用「多对多关系」了。

