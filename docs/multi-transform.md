
```ascii               MT
i.0 - initial promise
i.1 - initial promise on chunk

| write               | init | chunk1                             | chunk2
+---------------------+------+------------------------------------+-------------------------
| \+ transform        |      | r1.1 = await t1.1                  | await t1.2
|  |\- hook           |      | r2.1 = await [r1,h1.1]             | await [h1.1,h1.2]
|  |/                 |      |                                    |
|  |- catch           |      | r3.1 = await c1.1                  | await c.2
|  \+ transform       |      | r4.1 = await t2.1                  |
|   \+ transform      |      | r5.1 = await t3.1                  |
|    |\- hook         |      | r6.1 = await [c1.1, h2.1]          |
|    |/               |      |                                    |
|    |- catch         |      | r7.1 = await h2.1                  |
|    \+ transform     |      | r8.1 = t4 = await [h2.1, t4.1]     |
|     \- hook(read)   |      | r9.1 = await                       |
+---------------------+------+------------------------------------+-------------------------

```
