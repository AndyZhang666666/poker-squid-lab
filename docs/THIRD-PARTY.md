# 开源来源与实际复用

| 来源 | 固定来源 | 实际使用 |
| --- | --- | --- |
| AndyZhang666666/poker-ev-calculator | `0f3d478eec903851e7224bd779358fa00eb9260b`，MIT | 复用 cards/ranges/equity 基础，按本项目代码格式整理；保留物理组合、范围权重、排除已知牌和评估口径。恢复和备份沿用其保护思路，采用独立结构与存储键 |
| thlorenz/phe | npm `0.6.0`，MIT | 五至七张牌评估和编码，供首屏实际组合枚举使用 |
| boardgame.io | [公开项目与文档](https://github.com/boardgameio/boardgame.io)，MIT | 参考动作日志、状态转换与查看历史的设计；未复制代码，未引入运行时、多人大堂或联网服务 |
| 当前个人官网 | `32a393711aabcacdf6bc13d5015abf0c64ce4dfd` | 四套配色、字体与阅读风格；主题变量作为本工具自己的样式快照保留 |

phe 许可全文见 [third-party/phe.LICENSE](../third-party/phe.LICENSE)。本项目继续采用 MIT；原来源的许可和版权不会因项目改名而消失。

本轮新增鱿鱼事件规则、结算账本、成对模拟、限定河牌反事实、十二道计算题、进度与备份结构以及官网集成。

规则出处属于玩法依据，和开源代码来源分开记录，具体约定见 [方法说明](METHODS.md)。
