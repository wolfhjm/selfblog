# 系统内在逻辑草案

> 目标：让个人成长 OS 不只是记录工具，而是一套能把经历、情绪、认知、行为、健康状态和实验验证串起来的个人知识系统。

## 设计立场

本系统不做诊断，不替代心理咨询、医疗建议或治疗。它更像一个结构化反思和行为实验工具：帮助用户把真实经历拆细，把主观感受放回具体情境，把洞察变成可验证的小行动，再把实验结果回流到个人知识图谱。

系统的底层问题不是“今天记录了什么”，而是：

- 发生了什么？
- 我如何解释它？
- 我的情绪、身体和行为怎么反应？
- 这个反应背后有什么需求、恐惧、价值或资源限制？
- 如果要改变，最小可行动作是什么？
- 行动之后，原来的洞察被支持、修正还是反驳？

## 核心循环

```text
打卡 / 日记 / 对话 / 实验复盘
-> 拆分具体事件
-> 用 ABC / CBT 解释情绪与行为
-> 识别需求、价值、资源和健康背景
-> 形成洞察、经验教训或原则草稿
-> 用 Fogg / COM-B 设计小实验
-> 复盘实验结果
-> 回流验证状态和证据
-> 更新个人知识图谱
```

这个循环要让每个对象都有来处和去处：事件支撑洞察，洞察生成实验，实验验证原则，原则反过来指导下一次行动。

## 第一层模型：认知和情绪

### ABC / CBT 解释骨架

认知层优先采用 ABC / CBT 的思想：不是事件本身直接决定感受和行为，而是用户对事件的解释、自动想法和信念影响后续反应。Beck Institute 对 CBT cognitive model 的描述是，个体对情境的知觉或自动想法会影响情绪、行为和生理反应；APA 也把 CBT 描述为帮助人学习改变思维、问题情绪和行为的治疗方法。

系统字段建议：

- `activating_event`：触发事件，尽量客观。
- `context`：发生时的环境、时间、人物、任务和压力背景。
- `belief_or_interpretation`：用户当时如何解释这件事。
- `emotion`：情绪词和强度。
- `body_signal`：身体信号，例如紧绷、疲惫、心慌。
- `behavior_consequence`：行为结果，例如逃避、争辩、拖延、补救。
- `evidence_for`：支持这个解释的证据。
- `evidence_against`：反例或其他可能解释。
- `reframe`：更准确或更有用的新解释。

产品含义：

- “感受”不应孤立成一条漂浮记录，应默认挂到事件和解释上。
- “洞察”必须能追溯到事件、解释、感受和证据。
- AI 追问不应急着下结论，而要先把 A、B、C 拆清楚。

## 第二层模型：行为和实验

### Fogg Behavior Model

行动实验优先使用 Fogg Behavior Model：行为发生需要动机、能力和提示在同一时刻汇合。行为没发生时，不先归因为“意志力差”，而是检查三件事：

- `motivation`：我为什么想做？动机够不够具体？
- `ability`：这件事是否足够容易？成本、时间、技能门槛多高？
- `prompt`：有没有清晰触发点？在什么时候、看到什么、做什么？

实验字段建议：

- `target_behavior`：要发生的具体行为。
- `motivation_reason`：为什么值得做。
- `ability_barrier`：让它困难的地方。
- `tiny_version`：缩小后的最小版本。
- `prompt_plan`：触发提示。
- `success_criterion`：怎样算完成。
- `reflection`：做完后的体验。
- `failure_reason`：没做时缺的是动机、能力还是提示。

产品含义：

- 实验应该默认很小，最好 30 分钟内完成。
- 没完成实验时，系统先问“缺了 MAP 哪一环”，而不是做道德评价。
- 实验复盘要回流到洞察和原则的验证状态。

### COM-B 作为补充

Fogg 模型适合设计具体行为，COM-B 适合更系统地诊断行为阻力：行为受能力、机会和动机影响。它比 Fogg 多了“机会”这一层，适合解释环境和社会条件：

- `capability`：心理/身体能力，是否会做、是否有精力。
- `opportunity`：物理/社会机会，环境是否支持。
- `motivation`：自动动机和反思动机，是否真的想做。

产品含义：

- 如果用户长期做不到，不只看提示，也要看环境、关系、资源和身体状态。
- 实验建议可以标注“主要干预点”：提升能力、降低环境阻力、增强动机或重设提示。

## 第三层模型：健康和状态约束

健康状态不是外围信息，而是认知和行为的底层约束。睡眠不足、压力过高、久坐、缺运动、饮食混乱、社交隔离都会影响情绪、注意力和行动能力。WHO 关于压力的材料强调压力会影响身心，可能带来焦虑、烦躁、注意困难、身体不适、睡眠问题等；WHO 关于身体活动的材料也指出规律活动有身体和心理健康收益。

状态字段建议：

- `sleep_quality`：睡眠时长和质量。
- `energy_level`：精力水平。
- `stress_level`：压力强度和来源。
- `movement`：运动、步行、久坐情况。
- `nutrition`：饮食节律和明显异常。
- `social_contact`：连接感、孤独感、支持来源。
- `screen_load`：信息摄入和屏幕负荷。

产品含义：

- 系统不要把所有失败都解释成认知问题，有些是能量和环境问题。
- AI 生成洞察时要检查健康背景，避免过度心理化。
- 实验可以包含健康型实验，例如睡眠提示、散步、减少屏幕、恢复社交连接。

## 第四层模型：需求、价值和动机

### Self-Determination Theory

Self-Determination Theory 可以作为长期动机解释框架。它强调自主、胜任和关系三类基本心理需求对动机和健康很重要。

系统字段建议：

- `autonomy`：我是否觉得这是自己选择的？
- `competence`：我是否觉得自己做得到、在变好？
- `relatedness`：我是否感到连接、支持或被理解？
- `value_alignment`：这件事和我的长期价值有什么关系？

产品含义：

- 很多拖延不是单纯懒，而是自主感被削弱、胜任感受挫或关系压力过高。
- 原则不应只是效率准则，也应能保护用户真正重视的价值。
- 实验如果完全不符合用户价值，短期能做，长期也难维持。

## 第五层模型：目标到行动

### Implementation Intentions

目标需要落到具体触发计划。Implementation intentions 使用 if-then 计划，把情境线索和目标行为连接起来。NCI 的行为研究材料把它描述为把行动机会或关键时刻与有效反应绑定的计划，并指出证据支持它能帮助目标追求。

系统字段建议：

- `if_cue`：如果出现什么情境。
- `then_action`：我就做什么具体行动。
- `fallback_action`：如果做不到，退一步做什么。
- `review_time`：什么时候复盘。

产品含义：

- 原则要能落成 if-then。
- 实验要有明确触发条件，不能只写“我要更自律”。
- AI 可以从 ABC 里的高频触发事件生成 if-then 防线。

## 知识图谱设计

知识图谱适合这个系统，因为连接本身和节点一样重要。IBM 对 knowledge graph 的定义强调它表示实体、事件、情况或概念之间的关系，并由节点、边和标签构成；Neo4j 也把图数据库描述为用节点和关系存储数据，适合连接与数据本身同样重要的场景。

### 节点类型

- `HealthState`：睡眠、精力、压力、运动、饮食、连接感。
- `Context`：客观环境、时间、地点、人际和任务背景。
- `Event`：具体发生的事件。
- `Belief`：解释、自动想法、信念。
- `Emotion`：情绪和强度。
- `BodySignal`：身体反应。
- `Behavior`：实际行为或回避行为。
- `Need`：自主、胜任、关系、安全、掌控、休息等需求。
- `Insight`：通过事件得到的认识。
- `Lesson`：下次可复用的经验。
- `Principle`：个人化行动准则。
- `Experiment`：小行动实验。
- `Evidence`：原文片段、复盘结果、反例。
- `Value`：长期价值或身份方向。

### 边类型

- `occurred_in`：事件发生在某环境中。
- `triggered`：环境或事件触发了反应。
- `interpreted_as`：事件被解释为某信念。
- `led_to_emotion`：解释导致某情绪。
- `led_to_behavior`：情绪或解释导致某行为。
- `signals_need`：反应指向某需求。
- `supports`：证据支持洞察、原则或规律。
- `contradicts`：证据反驳洞察、原则或规律。
- `derived_from`：洞察来自事件或对话。
- `suggests_experiment`：洞察建议某实验。
- `validated_by`：实验验证某洞察或原则。
- `revises`：复盘修订旧原则。
- `shares_pattern_with`：不同事件共享模式。

### 关键查询

- 最近哪些事件都指向同一个信念？
- 哪些情绪经常在睡眠差或压力高时出现？
- 哪些原则有足够事件和实验支持？
- 哪些实验失败主要因为能力不足，而不是动机不足？
- 哪些洞察只有单一证据，仍然很脆弱？
- 哪些健康状态会显著影响行动完成率？

## 我建议补充的更多内在逻辑

这些模型不一定一次全做进数据库，但适合作为后续 prompt、字段和图谱关系的候选。

### 1. 情绪调节逻辑

用途：解释用户不是只有“想法错了”，还可能是情绪激活太高，需要先降唤醒再分析。

可落字段：

- 当前情绪强度
- 是否适合立刻分析
- 先调节还是先行动
- 有效调节方式：呼吸、散步、暂停、表达、求助

### 2. 压力-恢复逻辑

用途：避免系统把所有问题都推给认知或意志力。高压力和低恢复会直接降低能力。

可落字段：

- 压力源
- 恢复行为
- 恢复债
- 本周负荷趋势

### 3. 价值-身份逻辑

用途：让原则和实验不是孤立技巧，而是服务于“我想成为怎样的人”和“我真正重视什么”。

可落字段：

- 价值标签
- 身份方向
- 行为是否投票支持该身份
- 冲突价值：例如自由 vs 稳定，效率 vs 体验

### 4. 社会支持和关系逻辑

用途：很多事件不是个体内部问题，而是关系、边界、期待和支持系统问题。

可落字段：

- 关系角色
- 支持/消耗
- 边界是否清晰
- 是否需要沟通实验

### 5. 环境设计逻辑

用途：行为改变不只靠提醒，还要改环境。

可落字段：

- 摩擦点
- 诱因
- 默认选项
- 可移除干扰
- 可增加提示

### 6. 学习反馈逻辑

用途：把失败从“评价”变成“数据”。

可落字段：

- 假设
- 尝试
- 结果
- 学到什么
- 下一轮改什么

### 7. 风险边界逻辑

用途：系统要知道什么时候不适合继续自助分析，而应该建议寻求现实支持或专业帮助。

可落字段：

- 持续性
- 严重程度
- 功能受损
- 是否涉及安全风险
- 建议联系可信的人或专业资源

## V1 到 V2 的落地建议

### V1.1：先统一 prompt 和 payload

- 候选提取 payload 采用 ABC + Fogg 基础字段。
- 探索结构追问模式围绕 ABC 展开。
- 实验生成 prompt 改为 Fogg MAP。
- 实验复盘记录失败原因：动机、能力、提示、机会、健康状态。

### V1.2：增加事件链

- 一个来源对话生成一个事件链。
- 事件链内包含多个事件，每个事件有自己的解释、情绪、行为和证据。
- 候选收件箱按事件链分组展示。

### V1.3：图谱关系升级

- 不急着引入 Neo4j，先在 SQLite 里强化 `object_links`。
- 增加关系类型、证据强度、来源片段和验证状态。
- 地图页从“对象列表”升级为“证据链视图”。

### V2：真正知识图谱

- 当关系查询、跨对象推理和可视化需求明显增强后，再考虑图数据库或图查询层。
- 图谱不是为了炫酷可视化，而是为了回答“为什么我总在某类情境下产生某类反应，以及什么实验真的改变了它”。

## 参考来源

- [Fogg Behavior Model](https://www.behaviormodel.org/)
- [Beck Institute: Cognitive Model PDF](https://beckinstitute.org/wp-content/uploads/2024/05/Cognitive-Model.pdf)
- [APA: What is Cognitive Behavioral Therapy?](https://www.apa.org/ptsd-guideline/patients-and-families/cognitive-behavioral)
- [Self-Determination Theory](https://selfdeterminationtheory.org/the-theory/)
- [NCI: Implementation Intentions](https://cancercontrol.cancer.gov/brp/research/constructs/implementation-intentions)
- [COM-B overview on PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC8164288/)
- [WHO: Stress](https://www.who.int/news-room/questions-and-answers/item/stress)
- [WHO: Physical Activity](https://www.who.int/news-room/fact-sheets/detail/physical-activity)
- [IBM: What is a Knowledge Graph?](https://www.ibm.com/think/topics/knowledge-graph)
- [Neo4j Graph Database Concepts](https://neo4j.com/docs/getting-started/graph-database/)
