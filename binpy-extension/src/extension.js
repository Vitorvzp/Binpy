// BinPy VSCode Extension
// Provides: syntax awareness, hover decoding, commands, status bar, decorations
'use strict';

const vscode = require('vscode');

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Decodes a raw binary string (only 0s and 1s) into a UTF-8 string.
 * Non-binary characters are ignored. Returns null if size is invalid.
 */
function decodeBinary(raw) {
    const clean = raw.replace(/[^01]/g, '');
    if (clean.length === 0 || clean.length % 8 !== 0) return null;
    let result = '';
    for (let i = 0; i < clean.length; i += 8) {
        const byte = parseInt(clean.slice(i, i + 8), 2);
        result += String.fromCharCode(byte);
    }
    return result;
}

/**
 * Encodes a string to a binary string (space-separated bytes).
 */
function encodeText(text) {
    return [...text].map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
}

/**
 * Given a flat binary string and a cursor offset (within the clean string),
 * returns the 0-indexed byte number.
 */
function byteIndexAtOffset(cleanBin, offset) {
    return Math.floor(offset / 8);
}

/**
 * From a document position, compute the character offset in the CLEAN binary string.
 */
function cleanOffsetAtPosition(document, position) {
    const textUpToCursor = document.getText(new vscode.Range(new vscode.Position(0, 0), position));
    return textUpToCursor.replace(/[^01]/g, '').length;
}

// ─── Decoration types (alternating byte colors) ───────────────────────────

let decorationTypeEven;
let decorationTypeOdd;

function createDecorations() {
    decorationTypeEven = vscode.window.createTextEditorDecorationType({
        color: '#7dd3fc',       // sky-300 – even bytes
        fontWeight: 'normal',
    });
    decorationTypeOdd = vscode.window.createTextEditorDecorationType({
        color: '#a78bfa',       // violet-400 – odd bytes
        fontWeight: 'normal',
    });
}

/**
 * Applies alternating byte decorations to a .binpy editor.
 */
function applyByteDecorations(editor) {
    if (!editor || !vscode.workspace.getConfiguration('binpy').get('alternateByteColors')) return;
    const ext = editor.document.fileName.split('.').pop();
    if (ext !== 'binpy' && ext !== 'binhtml') return;

    const text = editor.document.getText();
    const evens = [];
    const odds = [];

    // Walk through raw text, tracking position
    let byteCount = 0;
    let bitBuf = 0;
    let docOffset = 0;
    let byteStartOffset = 0;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === '0' || ch === '1') {
            if (bitBuf === 0) byteStartOffset = i;
            bitBuf++;
            if (bitBuf === 8) {
                // Complete byte from byteStartOffset to i (inclusive)
                const startPos = editor.document.positionAt(byteStartOffset);
                const endPos = editor.document.positionAt(i + 1);
                const range = new vscode.Range(startPos, endPos);
                if (byteCount % 2 === 0) evens.push({ range });
                else odds.push({ range });
                byteCount++;
                bitBuf = 0;
            }
        }
        // Non-binary characters (spaces, newlines) just reset bit accumulation if incomplete
        // We DON'T reset bitBuf here intentionally — continuous binpy files have no separators
    }

    editor.setDecorations(decorationTypeEven, evens);
    editor.setDecorations(decorationTypeOdd, odds);
}

// ─── Status Bar ──────────────────────────────────────────────────────────────

let statusBarItem;

function updateStatusBar(editor) {
    if (!statusBarItem) return;
    if (!editor || !vscode.workspace.getConfiguration('binpy').get('showByteIndexInStatus')) {
        statusBarItem.hide();
        return;
    }
    const ext = editor.document.fileName.split('.').pop();
    if (ext !== 'binpy' && ext !== 'binhtml') {
        statusBarItem.hide();
        return;
    }

    const text = editor.document.getText();
    const cleanBin = text.replace(/[^01]/g, '');
    const totalBytes = Math.floor(cleanBin.length / 8);

    const cursorCleanOffset = cleanOffsetAtPosition(editor.document, editor.selection.active);
    const currentByte = Math.min(byteIndexAtOffset(cleanBin, cursorCleanOffset) + 1, totalBytes);

    statusBarItem.text = `$(symbol-binary) BinPy  Byte ${currentByte}/${totalBytes}`;
    statusBarItem.tooltip = `BinPy — ${cleanBin.length} bits / ${totalBytes} bytes\nClick to decode file`;
    statusBarItem.command = 'binpy.showDecodedPreview';
    statusBarItem.show();
}

// ─── Hover Provider ──────────────────────────────────────────────────────────

function createHoverProvider() {
    return vscode.languages.registerHoverProvider('binpy', {
        provideHover(document, position) {
            if (!vscode.workspace.getConfiguration('binpy').get('showDecorationOnHover')) return;

            const text = document.getText();
            const cleanBin = text.replace(/[^01]/g, '');
            if (cleanBin.length % 8 !== 0 && cleanBin.length < 8) return;

            const cursorOffset = cleanOffsetAtPosition(document, position);
            const byteIndex = byteIndexAtOffset(cleanBin, cursorOffset);
            const totalBytes = Math.floor(cleanBin.length / 8);

            if (byteIndex >= totalBytes) return;

            const byteBits = cleanBin.slice(byteIndex * 8, byteIndex * 8 + 8);
            const byteValue = parseInt(byteBits, 2);
            const charRepresentation = byteValue >= 32 && byteValue < 127
                ? `\`${String.fromCharCode(byteValue)}\``
                : byteValue === 10 ? '`\\n` (newline)'
                : byteValue === 13 ? '`\\r` (carriage return)'
                : byteValue === 9 ? '`\\t` (tab)'
                : `(control char)`;

            // Decode a small window of context (up to 20 chars) around cursor
            const windowStart = Math.max(0, byteIndex - 5);
            const windowEnd = Math.min(totalBytes, byteIndex + 15);
            const windowBits = cleanBin.slice(windowStart * 8, windowEnd * 8);
            let windowText = '';
            for (let i = 0; i < windowBits.length; i += 8) {
                const b = parseInt(windowBits.slice(i, i + 8), 2);
                windowText += b >= 32 && b < 127 ? String.fromCharCode(b) : '·';
            }

            const md = new vscode.MarkdownString();
            md.isTrusted = true;
            md.appendMarkdown(`**BinPy Byte #${byteIndex + 1}** of ${totalBytes}\n\n`);
            md.appendMarkdown(`| Field | Value |\n|---|---|\n`);
            md.appendMarkdown(`| Bits | \`${byteBits}\` |\n`);
            md.appendMarkdown(`| Decimal | \`${byteValue}\` |\n`);
            md.appendMarkdown(`| Hex | \`0x${byteValue.toString(16).padStart(2, '0').toUpperCase()}\` |\n`);
            md.appendMarkdown(`| Char | ${charRepresentation} |\n\n`);
            md.appendMarkdown(`**Context:** \`...${windowText}...\``);

            return new vscode.Hover(md);
        }
    });
}

// ─── Commands ────────────────────────────────────────────────────────────────

async function cmdDecodeFile() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const decoded = decodeBinary(editor.document.getText());
    if (decoded === null) {
        vscode.window.showErrorMessage('BinPy: Invalid binary content (length not a multiple of 8).');
        return;
    }

    const doc = await vscode.workspace.openTextDocument({
        language: 'python',
        content: decoded
    });
    vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside, preview: true });
}

async function cmdDecodeSelection() {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.selection.isEmpty) {
        vscode.window.showWarningMessage('BinPy: Please select some binary text first.');
        return;
    }

    const selectedText = editor.document.getText(editor.selection);
    const decoded = decodeBinary(selectedText);
    if (decoded === null) {
        vscode.window.showErrorMessage('BinPy: Selected text is not valid binary (must be multiple of 8 bits).');
        return;
    }

    const doc = await vscode.workspace.openTextDocument({
        language: 'plaintext',
        content: decoded
    });
    vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside, preview: true });
}

async function cmdEncodeSelection() {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.selection.isEmpty) {
        vscode.window.showWarningMessage('BinPy: Please select the text you want to encode.');
        return;
    }

    const selectedText = editor.document.getText(editor.selection);
    const encoded = encodeText(selectedText);

    const doc = await vscode.workspace.openTextDocument({
        language: 'binpy',
        content: encoded
    });
    vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside, preview: true });
}

async function cmdShowDecodedPreview() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const raw = editor.document.getText();
    const clean = raw.replace(/[^01]/g, '');
    const totalBytes = Math.floor(clean.length / 8);
    const remainder = clean.length % 8;

    const decoded = decodeBinary(raw);

    if (decoded === null && totalBytes === 0) {
        vscode.window.showWarningMessage('BinPy: No valid binary content found.');
        return;
    }

    // Build preview message for small files, else open beside
    if (totalBytes <= 100 && decoded) {
        const msg = `📄 Decoded (${totalBytes} bytes):\n${decoded}`;
        const action = await vscode.window.showInformationMessage(msg.slice(0, 200) + (msg.length > 200 ? '…' : ''), 'Open Full', 'Close');
        if (action === 'Open Full') await cmdDecodeFile();
    } else {
        if (remainder !== 0) {
            vscode.window.showWarningMessage(`BinPy: ${remainder} trailing bits ignored (not a complete byte).`);
        }
        await cmdDecodeFile();
    }
}

// ─── Activation ──────────────────────────────────────────────────────────────

function activate(context) {
    console.log('[BinPy] Extension activated.');

    createDecorations();

    // Status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    context.subscriptions.push(statusBarItem);

    // Hover provider
    context.subscriptions.push(createHoverProvider());

    // Commands
    context.subscriptions.push(vscode.commands.registerCommand('binpy.decodeFile', cmdDecodeFile));
    context.subscriptions.push(vscode.commands.registerCommand('binpy.decodeSelection', cmdDecodeSelection));
    context.subscriptions.push(vscode.commands.registerCommand('binpy.encodeSelection', cmdEncodeSelection));
    context.subscriptions.push(vscode.commands.registerCommand('binpy.showDecodedPreview', cmdShowDecodedPreview));

    // React to active editor changes
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                applyByteDecorations(editor);
                updateStatusBar(editor);
            }
        })
    );

    // React to cursor movement (update status bar byte index)
    context.subscriptions.push(
        vscode.window.onDidChangeTextEditorSelection(event => {
            updateStatusBar(event.textEditor);
        })
    );

    // React to document changes (re-apply decorations)
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document === event.document) {
                applyByteDecorations(editor);
                updateStatusBar(editor);
            }
        })
    );

    // Apply on startup if a .binpy file is already open
    if (vscode.window.activeTextEditor) {
        applyByteDecorations(vscode.window.activeTextEditor);
        updateStatusBar(vscode.window.activeTextEditor);
    }
}

function deactivate() {
    if (decorationTypeEven) decorationTypeEven.dispose();
    if (decorationTypeOdd) decorationTypeOdd.dispose();
    if (statusBarItem) statusBarItem.dispose();
}

module.exports = { activate, deactivate };
