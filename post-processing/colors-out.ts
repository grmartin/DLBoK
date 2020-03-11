import _ = require('lodash');

type ColorData = {"color": string; "count": number}[];
const colorData: ColorData = require(`${__dirname}/color_data_export.json`);

const html = (content: string) => `
<?xml version="1.0"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN"
	"http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
	<title></title>
	<style type="text/css">
		div.colorBox {
			display: inline-block;
			height: 2em;
			border: black 1px solid;
			width: 2em;
			margin-right: 0.5em;
		}
		li {
		    font-family: monospace;
			line-height: 2.5em;
		}
	</style>
</head>
<body><ul>
${content}
</ul></body>
</html>`;

const colors = colorData.map((x) => ({...x, cssColor: x.color.replace(/colors\//, '')}));

console.log(html(_.map(colors, (x) => `<li><div style="background-color: ${x.cssColor}" class="colorBox">&nbsp;</div>${x.color} : ${x.count}</li>`).join("\n")));
