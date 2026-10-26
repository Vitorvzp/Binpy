# BinPy

🟦 `> Python em bits · ferramentas para leitura e execução`

Experimento de linguagem esotérica que representa código Python com dígitos binários. O compilador e o interpretador são escritos em **Python**; a extensão para VS Code é escrita em **JavaScript**.

O formato transforma caracteres do código em números binários e os reconstrói antes de executar Python. É uma representação reversível para experimentação e ofuscação, sem criptografia ou isolamento de execução.

## Arquivos do projeto

| Arquivo | Função |
| --- | --- |
| [compilator.py](./compilator.py) | Lê um arquivo de texto e grava os bits em um `.binpy` com o mesmo nome base. |
| [interpreter.py](./interpreter.py) | Reconstrói o texto em grupos de oito bits e o executa com `exec()`. |
| [binpy-extension](./binpy-extension) | Código-fonte da extensão de edição para VS Code. |

Esta árvore não inclui aplicação Flask, servidor, templates, `app.py` ou arquivos `.binpy` de exemplo. Esses componentes não são necessários para usar as duas ferramentas de linha de comando.

## Uso local

Requer Python 3. Os dois scripts usam apenas a biblioteca padrão; não há pacote de dependências Python para instalar.

Crie um arquivo `exemplo.py` com código conhecido e caracteres ASCII, por exemplo:

```python
print("Hello, World!")
```

Na raiz do repositório:

```sh
python compilator.py exemplo.py
python interpreter.py exemplo.binpy
```

O primeiro comando cria ou sobrescreve `exemplo.binpy` na mesma pasta do arquivo de entrada. O segundo executa o conteúdo reconstruído com as permissões do processo Python. Leia o código original ou decodificado antes de executar um arquivo recebido de terceiros.

Para incorporar o interpretador em outro código Python, a função disponível é `run_binpy(filepath, context=None)`. Quando fornecido, `context` é passado como dicionário de globais para `exec()`; ele não cria um ambiente isolado.

## Formato e limites atuais

- O compilador concatena `format(ord(caractere), '08b')` para cada caractere, sem separadores.
- O interpretador remove espaços, quebras de linha e tabulações, exige comprimento múltiplo de oito e converte cada grupo com `int(bloco, 2)`.
- A largura `08b` é mínima, não um codificador UTF-8. Caracteres com valor acima de 255 podem produzir mais de oito bits e quebrar a reconstrução. Use ASCII nos exemplos até existir um contrato de codificação Unicode.
- Bits inválidos causam erro na conversão; exceções do Python executado também são propagadas.

## Extensão para VS Code

O manifesto em [binpy-extension/package.json](./binpy-extension/package.json) declara VS Code `^1.75.0` e reconhece `.binpy` e `.binhtml`. O código oferece:

- Cores alternadas para grupos de oito bits e informações do byte ao passar o mouse.
- Barra de status com posição e total de bytes.
- Comandos `BinPy: Decode File to Python`, `Decode Selection`, `Encode Selection to Binary` e `Show Decoded Preview`.
- Atalhos `Ctrl+Shift+B D` para decodificar e `Ctrl+Shift+B P` para prévia.

Os comandos abrem texto decodificado no editor; não executam o Python. A extensão descarta caracteres diferentes de `0` e `1` ao decodificar, enquanto o interpretador remove apenas os espaços em branco descritos acima. Portanto, uma prévia no editor não valida o arquivo para execução.

O repositório contém o código-fonte da extensão, sem pacote `.vsix` ou configuração de lançamento incluídos. Não há aplicativo web ou runtime JavaScript distribuído aqui.

## Licença

Não há arquivo `LICENSE` na árvore atual. Este README não atribui uma licença que o repositório não declara.
