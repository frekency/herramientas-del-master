# Herramientas del Máster

Herramientas para dirigir partidas de D&D 2024: tracker de combate, gestión de jugadores, bestiario y conjuros. Es una sola página HTML, sin dependencias ni compilación.

- **Publicado:** https://claude.ai/artifact/N4KWLLNZUVYXCYNriSYwtP
- **Versión:** ver `VERSION` y `CHANGELOG.md`.

## Archivos
| Archivo | Qué es |
|---|---|
| `index.html` | La aplicación completa (HTML + CSS + JS). |
| `srd2024_es.json` | Bestiario del SRD 5.2.1 en español (CC-BY-4.0, Wizards of the Coast). |
| `conjuros.json` | Conjuros generados a partir del CSV personal. **Uso personal**: no se publica ni se sube al repositorio. |
| `tools/build_srd.py` | Descarga y compacta el SRD 2024 en inglés desde Open5e. |
| `tools/build_es.py` | Extrae los textos del PDF oficial en español y los empareja con los datos en inglés. |
| `tools/build_spells.py` | Convierte el CSV de conjuros a `conjuros.json`. |

## Probarlo en local
```
python -m http.server 8000
```
y abre http://localhost:8000. Los datos (combate, grupo, encuentros, criaturas propias) se guardan en el navegador.

## Versionado
Versionado semántico. Cada cambio actualiza `VERSION`, `CHANGELOG.md`, el historial de la página principal y crea una etiqueta git `vX.Y.Z`.

## Licencias
El contenido del SRD 5.2.1 se usa bajo CC-BY-4.0: «This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License.»
