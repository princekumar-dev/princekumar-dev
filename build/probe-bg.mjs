const md = `
<table bgcolor="#181715">
  <tr>
    <td bgcolor="#181715" width="50%">CELL-BG</td>
    <td bgcolor="#23211D">CELL-BG-2</td>
  </tr>
</table>

<table>
  <tr>
    <td colspan="2" align="center" bgcolor="#181715">COLSPAN-BG</td>
  </tr>
</table>

<div align="center">
  <img src="./assets/divider.svg" width="100%" alt="" />
</div>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/header.svg">
  <img src="./assets/header.svg" width="100%" alt="pic">
</picture>
`;

const res = await fetch("https://api.github.com/markdown", {
  method: "POST",
  headers: {
    "User-Agent": "readme-verify",
    "Content-Type": "application/json",
    Accept: "application/vnd.github+json",
  },
  body: JSON.stringify({ mode: "gfm", text: md }),
});
console.log("status", res.status);
console.log(await res.text());
