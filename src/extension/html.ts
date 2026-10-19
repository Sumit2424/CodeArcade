import { randomBytes } from 'node:crypto';
import * as vscode from 'vscode';

/**
 * Builds the webview document with a restrictive Content Security Policy:
 * no network, no inline script, scripts only by one-time nonce, and styles
 * and images only from the extension's own dist/webview folder.
 */
export function buildWebviewHtml(webview: vscode.Webview, webviewRoot: vscode.Uri): string {
  const nonce = randomBytes(16).toString('base64');
  const script = webview.asWebviewUri(vscode.Uri.joinPath(webviewRoot, 'index.js'));
  const style = webview.asWebviewUri(vscode.Uri.joinPath(webviewRoot, 'index.css'));

  const csp = [
    "default-src 'none'",
    `style-src ${webview.cspSource}`,
    `img-src ${webview.cspSource}`,
    `script-src 'nonce-${nonce}'`,
  ].join('; ');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="${csp}" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="${style}" />
    <title>Code Arcade</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" nonce="${nonce}" src="${script}"></script>
  </body>
</html>`;
}
