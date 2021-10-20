function escapeText(tmp_str)
{
  tmp_str = tmp_str.replace(/&/g, "&amp;");
  tmp_str = tmp_str.replace(/</g, "&lt;");
  tmp_str = tmp_str.replace(/>/g, "&gt;");
  tmp_str = tmp_str.replace(/\'/g, "&#39;");
  tmp_str = tmp_str.replace(/\"/g, "&quot;");
  tmp_str = tmp_str.replace(/\`/g, "&#96;");
  tmp_str = tmp_str.replace(/\\/g, "&#92;");
  tmp_str = tmp_str.replace(/\|/g, "&#124;");
  tmp_str = tmp_str.replace(/\//g, "&#47;");

  return tmp_str;
}

module.exports = escapeText;