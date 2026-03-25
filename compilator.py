import sys
import os


def compile_to_binpy(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    binary = ''.join(format(ord(c), '08b') for c in content)

    output_path = os.path.splitext(filepath)[0] + '.binpy'
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(binary)

    print(f"Compilado: {filepath} -> {output_path}")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Uso: python compilator.py arquivo.py")
        sys.exit(1)
    compile_to_binpy(sys.argv[1])
