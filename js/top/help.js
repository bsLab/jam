var Doc = Require('doc/doc');

var Sections = {
  Into:FileEmbedded('doc/../../doc/jam.md','utf8'),
  Lib:FileEmbedded('doc/../../doc/api.md','utf8'),
  Aios:FileEmbedded('doc/../../doc/aios.md','utf8'),
}

print(Sections.Aios)
