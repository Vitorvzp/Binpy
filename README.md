<div align="center">

# 🔢 BinPy

**Uma linguagem de programação esotérica onde o código-fonte é binário puro — mas o motor por trás é Python.**

[![Python](https://img.shields.io/badge/Python-3.8+-blue?logo=python)](https://python.org)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![VSCode Extension](https://img.shields.io/badge/VSCode-Extension%20Included-007ACC?logo=visualstudiocode)](./binpy-extension)

</div>

---

## O que é BinPy?

BinPy é uma [Esolang](https://en.wikipedia.org/wiki/Esoteric_programming_language) que aceita **apenas código binário ASCII de 8 bits** como sintaxe. Por baixo, todo bit é convertido de volta a Python e executado normalmente.

```
print("Hello, World!")  →  01110000 01110010 01101001 01101110 01110100 00101000
                             00100010 01001000 01100101 01101100 01101100 01101111
                             00101100 00100000 01010111 01101111 01110010 01101100
                             01100100 00100010 00101001
```

O uso principal é **ofuscar código Python** — um servidor Flask pode servir toda sua lógica em binário, tornando a leitura do código-fonte humanamente impraticável.

---

## Estrutura do Projeto

```
BinLoader/
├── interpreter.py        ← Runtime: decodifica .binpy e executa com exec()
├── compilator.py         ← Compilador: converte .py → .binpy
├── app.py                ← Bootstrap Loader (ponto de entrada do servidor)
├── app_logic.py          ← Lógica Flask original (remover do servidor em produção)
├── app.binpy             ← app_logic.py compilado (ofuscado)
├── static/style.css
├── templates/
└── binpy-extension/      ← Extensão VSCode para suporte à linguagem
```

---

## Uso Rápido

### 1. Compilar Python → BinPy

```bash
python compilator.py meu_script.py
# Gera: meu_script.binpy
```

### 2. Executar um arquivo `.binpy`

```bash
python interpreter.py meu_script.binpy
```

### 3. Rodar o servidor Flask ofuscado

```bash
python app.py
```

> ⚠️ `app_logic.py` e `compilator.py` devem ser **removidos do servidor de produção** após a compilação.

---

## Fluxo Completo

```
app_logic.py  ──►  compilator.py  ──►  app.binpy
                                            │
                   Python Runtime  ◄──  interpreter.py  (exec)
                                            ▲
                                       app.py  (bootstrap)
```

---

## Extensão VSCode

A pasta [`binpy-extension/`](./binpy-extension) contém uma extensão completa para VSCode com:

| Recurso | Descrição |
|---|---|
| 🎨 Syntax Highlighting | Bytes alternados em azul/violeta |
| 🔍 Hover Decoder | Bits → decimal → hex → char ao passar o mouse |
| 📊 Status Bar | `Byte X / Y` em tempo real |
| ⚡ Decode File | `Ctrl+Shift+B D` — abre Python decodificado |
| 👁 Preview | `Ctrl+Shift+B P` — popup com conteúdo |
| ✂️ Decode/Encode Selection | Converte trechos selecionados |

**Para usar:** Abra a pasta `binpy-extension/` no VSCode e pressione `F5`.

---

## Estratégias de Ofuscação

1. **Back-end** — Toda lógica Flask vive no `.binpy`; apenas o loader e o interpretador ficam visíveis
2. **Front-end** — HTML convertido em binário; script JS decodifica e injeta via `document.write()` em runtime
3. **Planejado: Cifra XOR** — Camada extra sobre o binário, ilegível por conversores ASCII online

---

## Changelog

| Versão | O que mudou |
|---|---|
| v0.1 | Prova de conceito: `exec()` de string binária inline |
| v0.2 | `interpreter.py` como script CLI standalone |
| v0.3 | `compilator.py`: conversão `.py → .binpy` automática |
| v0.4 | Integração com Flask via `exec(code, globals())` |
| v0.5 | Ofuscação de templates HTML via JavaScript |
| v0.6 *(planejado)* | Cifra XOR sobre o binário |
| v0.7 *(planejado)* | Script `build.py` automatizando compilação + limpeza |

---

## Aviso de Segurança

> **Segurança por Obscuridade ≠ Segurança Real.**  
> BinPy é uma camada de disfarce, não criptografia. Qualquer pessoa com acesso ao `interpreter.py` consegue reverter o binário. Use em conjunto com práticas reais de segurança (SSL, autenticação, firewalls).

---

<div align="center">
Feito com 01100001 01101101 01101111 01110010 &nbsp;·&nbsp; <em>amor em binário</em>
</div>
