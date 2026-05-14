---
title: AES 与 DES
date: '2026-05-13 00:22:10'
tags: []
mood: ''
cover: /uploads/20260514/a0888eef7ba44e5196744dafb424ac06.png
description: ''
---

AES 和 DES 都是分组密码，但它们不是母子关系，更像前后两个时代的标准。DES 是 1970s 的产物，AES 是 2000s 后真正大量使用的主力。把它们放在一起讲，是因为逆向里很多工作不是“手推 AES”，而是识别程序用了什么库、什么模式、key/iv 从哪来，然后把同样的流程搬到 Python 里复现。

> DES 现在更像一个经典教材例子，有点像学汇编时绕不开 16 位实模式：不一定天天用，但很适合拿来理解结构。它是 Feistel 网络，64 bit 分组，16 轮，有效密钥 56 bit。
>
> AES 则是现代标准里的主力，SPN 结构，128 bit 分组，密钥可以是 128/192/256 bit。把它们放在一起看，不是为了少写一篇，虽然也确实少写了一篇（），而是因为很多 CTF 坑都不在算法核心，而在“分组密码怎么被拿来用”这一层。

## 1. 逆向里先看什么

遇到 AES/DES 题，第一反应不要是把算法公式背一遍，而是先把程序里的加密链路还原出来。很多题根本不是自己实现 AES，而是调用库；这时重点就是往上追 key、iv、mode、padding 从哪来。

比较稳的顺序是：

1. 先看导入表和字符串，判断是不是库调用。
2. 再找模式字符串和参数，比如 `CBC`、`ECB`、`PKCS5Padding`、`AES_set_encrypt_key`。
3. 然后追 key、iv、nonce、密文和明文来源。
4. 最后才考虑算法内部，看它是不是自实现 AES/DES 或者魔改。

如果是普通 Windows/Linux 程序，看到 `AES_set_encrypt_key`、`EVP_aes_128_cbc`、`CryptEncrypt`、`BCryptEncrypt`、`javax.crypto.Cipher`、`AES/CBC/PKCS5Padding` 这类东西，比去找 S 盒快得多。库调用题可以在 `EVP_DecryptUpdate`、`CryptDecrypt`、`BCryptDecrypt`、`Cipher.doFinal` 这类函数附近下断，观察传进去的 key、iv、密文和返回后的明文。

如果没有明显库调用，再考虑搜常量。AES 自实现里可能有 S 盒表，开头常见：

```
63 7c 77 7b f2 6b 6f c5 ...
```

DES 自实现会有一堆 IP、E、P、S-box 表，数字表很多，看着像“密密麻麻的置换表”。新手不需要一眼认完所有表，能判断“这里大概率是 AES/DES 自实现”就够了，后面可以先动态调试看输入输出。

实际做题时最重要的是复现链路。比如程序先 `md5(password)` 得到 16 字节 key，再从文件头取 16 字节 IV，最后 AES-CBC 解密资源，那脚本里也必须一模一样。少一步 hash、hex 解码方向错、IV 少截一字节，结果都会像“算法不对”，但其实只是参数没对齐。

## 2. 总览对照

| 特性 | DES (Data Encryption Standard) | AES (Advanced Encryption Standard) |
|------|--------------------------------|-----------------------------------|
| 网络结构 | Feistel 网络 | SPN (Substitution-Permutation Network) |
| 分组长度 | 64 bit (8 字节) | 128 bit (16 字节) |
| 密钥长度 | 64 bit 输入 (实际有效 56 bit) | 128 / 192 / 256 bit |
| 轮数 | 16 轮 | 10 / 12 / 14 轮 |
| 非线性来源 | 8 个 S 盒 (6bit -> 4bit) | 字节 S 盒 (8bit -> 8bit) |
| 扩散方式 | E 扩展、P 置换、多轮左右交换 | ShiftRows、MixColumns |
| 解密方式 | 与加密相同，仅子密钥倒序使用 | 使用对应的逆变换 |
| 安全状态 | 单 DES 已不安全 | 正确使用时仍是主流标准 |

它们的共同点其实很朴素：算法核心只管一个固定长度分组，DES 是 8 字节，AES 是 16 字节。真实消息一长，就必须靠工作模式把一块块串起来；ECB/CBC 这类模式还要处理 padding；只加密不认证时，密文被人改了也未必能发现。

所以 CTF 里很少让你正面“打穿 AES”，更多是在模式、padding、nonce、IV、编码这些地方动手脚。逆向题也是一样，重点通常不是证明 AES 为什么安全，而是把程序怎么用 AES 这件事看明白。

## 3. 工作模式和 Padding

核心算法只处理一个 block，遇到很长的内容时，通常会走这样一条路：

```
明文 -> padding -> 切块 -> 工作模式 -> 密文
```

AES 和 DES 的很多坑都在这条链上。AES-CBC 和 DES-CBC 的思路也很像，区别主要是分组大小：AES 是 16 字节，DES 是 8 字节。

### 3.1 ECB

ECB 是最直接的模式，每块明文独立加密：

```
C_i = E_K(P_i)
```

它的问题也很明显：相同明文块会产生相同密文块，结构藏不住。看到密文里重复块很多，就该怀疑 ECB。后面常见玩法就是块替换、cut-and-paste token，AES 里还经常考 byte-at-a-time。

### 3.2 CBC

CBC 每一块在加密前，先和上一块密文异或：

```
C_i = E_K(P_i XOR C_{i-1})
P_i = D_K(C_i) XOR C_{i-1}
```

第一块没有上一块密文，所以要引入 IV。也正因为这个结构，改 IV 可以影响第一块明文，改 `C_{i-1}` 可以影响 `P_i`。padding oracle 也是从这里来的：服务端把 padding 对错泄露出来，攻击者就能一点点逼出明文。

### 3.3 CTR

CTR 不直接加密明文，而是加密 `nonce || counter`，生成密钥流后再和明文异或：

```
keystream_i = E_K(nonce || counter_i)
C_i = P_i XOR keystream_i
```

CTR 不需要 padding，但 nonce/counter 不能复用。复用后密钥流相同，两个密文一异或就会把密钥流抵消掉：

```
C1 XOR C2 = P1 XOR P2
```

### 3.4 GCM

GCM 常用于 AES，可以先理解成：

```
GCM = CTR 加密 + GHASH 认证
```

它不只保护明文不被看见，也能发现密文有没有被改过。逆向里遇到 GCM 时，除了 key 和 nonce，还要注意 tag 和 AAD。GCM 也很怕 nonce 复用，严重时不只是泄露明文，还可能影响认证。

### 3.5 Padding

ECB/CBC 要求明文长度是分组长度倍数，所以需要 padding。简单说，padding 就是“凑数”。AES 的 block 是 16 字节，DES 的 block 是 8 字节；如果明文装不满最后一块，就要补到刚好对齐。

PKCS#7 的规则最常见：

```
缺 n 字节就补 n 个值为 n 的字节
```

比如 AES-CBC 还差 5 字节，就补 5 个 `0x05`。如果明文本来正好对齐，也要再补一整块。零填充、ISO/IEC 7816-4、NoPadding 也会遇到，但多数时候是解密后末尾不对劲，才回头检查具体是哪一种。

| padding | 特点 |
|---------|------|
| PKCS#7 | 最常见，缺几字节就补几个对应值 |
| Zero padding | 补 `\x00` |
| ISO/IEC 7816-4 | 先补 `0x80`，再补 `0x00` |
| NoPadding | 输入必须已经对齐 |

## 4. AES 逆向识别

AES 的 block 固定是 16 字节，key 可以是 16、24、32 字节，对应 AES-128、AES-192、AES-256。轮数分别是 10、12、14。逆向里最常见的是 AES-128，也就是 16 字节 key、10 轮。

AES-128 加密流程大概是：

```
明文 state
 -> AddRoundKey(K0)
 -> 9 轮:
      SubBytes
      ShiftRows
      MixColumns
      AddRoundKey
 -> 最后一轮:
      SubBytes
      ShiftRows
      AddRoundKey
 -> 密文
```

最后一轮没有 `MixColumns`。这个点在看自实现 AES 时很有用，因为很多伪代码会表现出“前面循环 9 次，最后单独处理 1 次”的结构。

几个常见识别点：

1. AES S 盒开头常见 `63 7c 77 7b f2 6b 6f c5`。
2. 密钥扩展里会出现 `RotWord`、`SubWord`、`Rcon`，常见轮常量有 `01 02 04 08 10 20 40 80 1b 36`。
3. `MixColumns` 经常会出现 `0x02`、`0x03`、`0x1b` 这些有限域乘法相关操作。
4. AES-128 常见 10 轮结构，AES-192 是 12 轮，AES-256 是 14 轮。
5. 如果每次处理 16 字节，并且前面有一大张 256 字节表，就很值得怀疑 AES。

需要注意的是，很多题不会把函数名留成 `aes_encrypt`。更常见的是一个普通函数里有循环、表查找、异或、16 字节状态变化。这个时候不要急着手算，先找输入输出：哪个 buffer 是明文，哪个 buffer 是密文，key 从哪来，最后比较的是哪一段。

## 5. DES / 3DES 逆向识别

DES 的 block 是 8 字节，key 输入看起来也是 8 字节，但每个字节里有 1 bit 是奇偶校验位，所以有效密钥只有 56 bit。它跑 16 轮 Feistel，解密时只要把子密钥倒序使用。

DES 总流程可以粗略记成：

```
64 bit 明文
 -> IP 初始置换
 -> L0 || R0，各 32 bit
 -> 16 轮 Feistel
 -> R16 || L16
 -> FP / IP^-1
 -> 64 bit 密文
```

轮函数里会有 E 扩展、S 盒、P 置换：

```
R(32)
 -> E 扩展置换，32 -> 48
 -> XOR 子密钥 Ki，48 bit
 -> S 盒替代，8 * (6 -> 4)
 -> P 置换，32 bit
```

逆向里不需要一开始就背完 IP、E、P、PC-1、PC-2 每张表的内容。比较实用的判断方式是：看它是不是 8 字节一组、有没有 16 轮、有没有大量固定置换表和 8 个 S-box。只要判断出“这东西像 DES”，后面就可以围绕 key、mode、padding 去复现。

3DES / DES-EDE 可以简单记成：

```
C = E_K3(D_K2(E_K1(P)))
```

3DES 的 key 常见两种长度：16 字节时一般是两密钥形式，实际按 `K1,K2,K1` 跑；24 字节时是三密钥形式，也就是 `K1,K2,K3`。3DES 比 DES 强，但 block 仍然只有 64 bit，新系统已经不建议继续使用。

## 6. 复现时最容易错的地方

做题时经常不是算法错，而是参数错。下面这些地方尤其容易踩坑：

1. key 是原始字节，还是 hex 字符串。
2. IV 是固定常量，还是从文件头、网络包、输入里截出来的。
3. 模式到底是 ECB、CBC、CTR 还是 GCM。
4. padding 是 PKCS#7、Zero padding，还是根本没有 padding。
5. 明文或密文是不是又套了一层 base64、hex、URL encode。
6. key 是不是经过 MD5、SHA1、SHA256、PBKDF 之类的派生。
7. 程序初始化阶段有没有改全局变量，比如 TLS callback、init_array、JNI_OnLoad。
8. 最终比较前是不是又做了异或、换表、压缩或反序。

这里最典型的坑就是 hex：

```
key = b"00112233445566778899aabbccddeeff"              # 32 字节 ASCII，AES-256
key = bytes.fromhex("00112233445566778899aabbccddeeff") # 16 字节，AES-128
```

看起来都是一串 key，但长度完全不一样。DES key 必须 8 字节，AES key 必须 16/24/32 字节。长度不对时，先查编码和派生过程，不要马上怀疑算法。

逆向里最稳的路线是先把“调用点”找出来。库调用题在加解密函数附近下断，自实现题在最终比较前下断，看程序拿什么东西和你的输入结果比较。这样做不丢人，逆向本来就是能动态拿就别硬熬静态。

## 7. 做题时怎么接下去

如果后面要继续写，不建议再往 AES 的数学细节里钻。更适合接一个完整的小例题，按下面这个顺序展开：

1. 先贴关键伪代码，说明为什么怀疑 AES/DES。
2. 标出识别点，比如 S 盒、Rcon、16 字节循环、`EVP_aes_128_cbc()`。
3. 追 key、iv、ciphertext 从哪里来。
4. 检查有没有初始化函数、TLS callback、反调试或全局变量修改。
5. 写 Python 脚本复现解密。
6. 如果第一次解不出来，说明怎么排查 mode、padding、hex/base64、大小端这些问题。

也就是说，这篇文章到这里就够了：它负责讲“怎么认、怎么追、怎么复现”。真正让逆向能力涨起来的是后面的例题，而不是继续把有限域乘法推到更细。

## 8. 代码实现：Python 调用留档

安装：

```
pip install pycryptodome
```

### 8.1 AES-CBC

```
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad

key = b"0123456789abcdef"
iv = b"1234567890abcdef"
pt = b"flag{aes_demo}"

ct = AES.new(key, AES.MODE_CBC, iv).encrypt(pad(pt, 16))
got = unpad(AES.new(key, AES.MODE_CBC, iv).decrypt(ct), 16)
assert got == pt
```

### 8.2 DES-CBC

```
from Crypto.Cipher import DES
from Crypto.Util.Padding import pad, unpad

key = b"8bytekey"
iv = b"12345678"
pt = b"flag{des_demo}"

ct = DES.new(key, DES.MODE_CBC, iv).encrypt(pad(pt, 8))
got = unpad(DES.new(key, DES.MODE_CBC, iv).decrypt(ct), 8)
assert got == pt
```

### 8.3 AES-GCM

```
from Crypto.Cipher import AES

key = b"0123456789abcdef"
nonce = b"123456789012"
aad = b"header"
pt = b"flag{gcm_demo}"

cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
cipher.update(aad)
ct, tag = cipher.encrypt_and_digest(pt)

dec = AES.new(key, AES.MODE_GCM, nonce=nonce)
dec.update(aad)
assert dec.decrypt_and_verify(ct, tag) == pt
```

GCM 解密必须验证 tag。只 `decrypt()` 不 `verify()` 等于丢掉认证。

## 9. 代码实现：C 语言 OpenSSL EVP 调用留档

EVP 接口统一，AES/DES 只需要换 `EVP_aes_128_cbc()` 或 `EVP_des_cbc()`。

```
#include <openssl/evp.h>
#include <stdio.h>
#include <string.h>

int evp_crypt(const EVP_CIPHER *cipher, int enc,
              const unsigned char *key, const unsigned char *iv,
              const unsigned char *in, int in_len,
              unsigned char *out, int *out_len) {
    EVP_CIPHER_CTX *ctx = EVP_CIPHER_CTX_new();
    int len = 0, total = 0;
    if (!ctx) return 0;
    if (EVP_CipherInit_ex(ctx, cipher, NULL, key, iv, enc) != 1) return 0;
    if (EVP_CipherUpdate(ctx, out, &len, in, in_len) != 1) return 0;
    total += len;
    if (EVP_CipherFinal_ex(ctx, out + total, &len) != 1) return 0;
    total += len;
    *out_len = total;
    EVP_CIPHER_CTX_free(ctx);
    return 1;
}

int main(void) {
    const unsigned char aes_key[16] = "0123456789abcdef";
    const unsigned char aes_iv[16] = "1234567890abcdef";
    const unsigned char des_key[8] = "8bytekey";
    const unsigned char des_iv[8] = "12345678";
    const unsigned char msg[] = "flag{evp_demo}";
    unsigned char ct[128], pt[128];
    int ct_len = 0, pt_len = 0;

    if (!evp_crypt(EVP_aes_128_cbc(), 1, aes_key, aes_iv, msg, (int)strlen((const char *)msg), ct, &ct_len)) return 1;
    if (!evp_crypt(EVP_aes_128_cbc(), 0, aes_key, aes_iv, ct, ct_len, pt, &pt_len)) return 1;
    pt[pt_len] = 0;
    printf("AES plain: %s\n", pt);

    if (!evp_crypt(EVP_des_cbc(), 1, des_key, des_iv, msg, (int)strlen((const char *)msg), ct, &ct_len)) return 1;
    if (!evp_crypt(EVP_des_cbc(), 0, des_key, des_iv, ct, ct_len, pt, &pt_len)) return 1;
    pt[pt_len] = 0;
    printf("DES plain: %s\n", pt);
    return 0;
}
```

编译：

```
gcc aes_des_evp_demo.c -o aes_des_evp_demo -lcrypto
```

OpenSSL 3.x 中 DES 可能受 legacy provider 影响。如果报 `unsupported`，先检查 provider 配置。

## 10. 代码实现：AES/DES 离线工具脚本留档

保存为 `aes_des_tool.py`。依赖 `pycryptodome`，支持 AES、DES、3DES 的 ECB/CBC/CTR，以及 AES-GCM。

```
#!/usr/bin/env python3
import argparse
from Crypto.Cipher import AES, DES, DES3
from Crypto.Util.Padding import pad, unpad


def get_module(algo):
    if algo == "aes":
        return AES, 16
    if algo == "des":
        return DES, 8
    return DES3, 8


def make_cipher(algo, mode, key, iv, nonce):
    mod, _ = get_module(algo)
    if mode == "ecb":
        return mod.new(key, mod.MODE_ECB)
    if mode == "cbc":
        if iv is None:
            raise ValueError("CBC needs --iv")
        return mod.new(key, mod.MODE_CBC, iv)
    if mode == "ctr":
        if nonce is None:
            raise ValueError("CTR needs --nonce")
        return mod.new(key, mod.MODE_CTR, nonce=nonce)
    if mode == "gcm":
        if algo != "aes":
            raise ValueError("GCM only supports AES here")
        if nonce is None:
            raise ValueError("GCM needs --nonce")
        return AES.new(key, AES.MODE_GCM, nonce=nonce)
    raise ValueError("bad mode")


def main():
    ap = argparse.ArgumentParser(description="AES/DES/3DES common mode tool")
    ap.add_argument("data", help="hex data")
    ap.add_argument("-a", "--algo", choices=["aes", "des", "3des"], required=True)
    ap.add_argument("-m", "--mode", choices=["ecb", "cbc", "ctr", "gcm"], default="cbc")
    ap.add_argument("-k", "--key", required=True, help="hex key")
    ap.add_argument("--iv", help="hex IV for CBC")
    ap.add_argument("--nonce", help="hex nonce for CTR/GCM")
    ap.add_argument("--tag", help="hex tag for GCM decrypt")
    ap.add_argument("--aad", default="", help="hex AAD for GCM")
    ap.add_argument("-d", "--decrypt", action="store_true")
    ap.add_argument("--no-pad", action="store_true")
    args = ap.parse_args()

    key = bytes.fromhex(args.key)
    data = bytes.fromhex(args.data)
    iv = bytes.fromhex(args.iv) if args.iv else None
    nonce = bytes.fromhex(args.nonce) if args.nonce else None
    cipher = make_cipher(args.algo, args.mode, key, iv, nonce)
    _, bs = get_module(args.algo)

    if args.mode == "gcm" and args.aad:
        cipher.update(bytes.fromhex(args.aad))

    if args.decrypt:
        if args.mode == "gcm":
            if not args.tag:
                raise ValueError("GCM decrypt needs --tag")
            out = cipher.decrypt_and_verify(data, bytes.fromhex(args.tag))
        else:
            out = cipher.decrypt(data)
            if args.mode in ("ecb", "cbc") and not args.no_pad:
                out = unpad(out, bs)
    else:
        if args.mode in ("ecb", "cbc") and not args.no_pad:
            data = pad(data, bs)
        if args.mode == "gcm":
            out, tag = cipher.encrypt_and_digest(data)
            print("tag=" + tag.hex())
        else:
            out = cipher.encrypt(data)
    print(out.hex())


if __name__ == "__main__":
    main()
```

示例：

```
python aes_des_tool.py 666c61677b6165737d -a aes -k 30313233343536373839616263646566 --iv 31323334353637383930616263646566
python aes_des_tool.py <cipher_hex> -a aes -k <key_hex> --iv <iv_hex> -d
python aes_des_tool.py 666c61677b6465737d -a des -k 38627974656b6579 --iv 3132333435363738
python aes_des_tool.py <cipher_hex> -a des -k 38627974656b6579 --iv 3132333435363738 -d
```

## 11. 参考资料

* 参考博客 AES/DES 结构写法：https://goodapple.top/archives/162
* NIST FIPS 197 AES：https://csrc.nist.gov/pubs/fips/197/final
* NIST FIPS 46-3 DES：https://csrc.nist.gov/pubs/fips/46-3/final
* PyCryptodome AES 文档：https://pycryptodome.readthedocs.io/en/stable/src/cipher/aes.html
* PyCryptodome DES 文档：https://pycryptodome.readthedocs.io/en/stable/src/cipher/des.html
