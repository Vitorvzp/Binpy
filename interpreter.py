import sys


def run_binpy(filepath, context=None):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    binary_str = content.replace(' ', '').replace('\n', '').replace('\t', '').replace('\r', '')

    if len(binary_str) % 8 != 0:
        raise ValueError(f"Conteúdo binário inválido: tamanho {len(binary_str)} não é múltiplo de 8")

    code = ''
    for i in range(0, len(binary_str), 8):
        block = binary_str[i:i+8]
        code += chr(int(block, 2))

    if context is None:
        exec(code)
    else:
        exec(code, context)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Uso: python interpreter.py arquivo.binpy")
        sys.exit(1)
    run_binpy(sys.argv[1])
