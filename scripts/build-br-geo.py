"""Build the PetFlow Brazil-only IP index from MVI Tech's DB-IP Lite database."""
import base64
import gzip
import sqlite3
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = Path(r"D:\Projeto DevClub\Projeto MVI Tech\geo\regions.sqlite")
OUT = ROOT / "src/lib/br-ranges.data.ts"
REGIONS = {
    "Acre": "AC", "Alagoas": "AL", "Amapa": "AP", "Amazonas": "AM",
    "Bahia": "BA", "Ceara": "CE", "Federal District": "DF", "Espirito Santo": "ES",
    "Goias": "GO", "Maranhao": "MA", "Mato Grosso": "MT", "Mato Grosso do Sul": "MS",
    "Minas Gerais": "MG", "Para": "PA", "Paraiba": "PB", "Parana": "PR",
    "Pernambuco": "PE", "Piaui": "PI", "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN",
    "Rio Grande do Sul": "RS", "Rondonia": "RO", "Roraima": "RR", "Santa Catarina": "SC",
    "Sao Paulo": "SP", "Sergipe": "SE", "Tocantins": "TO",
}

connection = sqlite3.connect(f"file:{DB.as_posix()}?mode=ro", uri=True)
rows = connection.execute("SELECT family,start,end,region FROM ranges WHERE country='BR' ORDER BY family,start")
parts = {4: bytearray(), 6: bytearray()}
counts = {4: 0, 6: 0}
previous = {4: None, 6: None}
for family, start, end, region in rows:
    width = {4: 4, 6: 16}.get(family)
    if width is None or len(start) != width or len(end) != width:
        raise ValueError("Unexpected IP range shape")
    if region not in REGIONS:
        raise ValueError(f"Unmapped region: {region}")
    if previous[family] is not None and previous[family] >= start:
        raise ValueError("Ranges are out of order or overlapping")
    if start > end:
        raise ValueError("Invalid IP range")
    parts[family] += start + end + REGIONS[region].encode("ascii")
    counts[family] += 1
    previous[family] = end
connection.close()
raw = b"PBR1" + struct.pack(">II", counts[4], counts[6]) + parts[4] + parts[6]
packed = gzip.compress(raw, compresslevel=9, mtime=0)
encoded = base64.b64encode(packed).decode("ascii")
OUT.write_text(
    '// Brazil-only IP ranges derived from DB-IP City Lite (CC BY 4.0). See /controle attribution.\n'
    f'export const BR_RANGES_GZIP_BASE64 = "{encoded}";\n', encoding="utf-8"
)
print(f"IPv4: {counts[4]}, IPv6: {counts[6]}, raw: {len(raw)}, gzip: {len(packed)}, TypeScript: {OUT.stat().st_size}")
