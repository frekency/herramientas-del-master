# Herramientas del Máster

Herramientas para dirigir partidas de D&D 2024: tracker de combate, gestión de jugadores, bestiario y conjuros. Es una sola página HTML, sin dependencias ni compilación.

- **Versión pública (solo SRD):** https://claude.ai/artifact/K7X9AHasDjENmmQ8457oZW
- **Versión personal:** https://claude.ai/artifact/N4KWLLNZUVYXCYNriSYwtP
- **Versión:** ver `VERSION` y `CHANGELOG.md`.

## Archivos
| Archivo | Qué es |
|---|---|
| `index.html` | La aplicación completa (HTML + CSS + JS). |
| `srd2024_es.json` | Bestiario del SRD 5.2.1 en español (CC-BY-4.0, Wizards of the Coast). |
| `conjuros_srd.json` | Los 339 conjuros del SRD 5.2.1 en español con su nombre en inglés (CC-BY-4.0). Base de serie. |
| `conjuros.json` | Conjuros generados a partir del CSV personal (manuales). **Uso personal**: no se publica en abierto ni se sube al repositorio. |
| `tools/build_srd.py` | Descarga y compacta el SRD 2024 en inglés desde Open5e. |
| `tools/build_es.py` | Extrae los textos del PDF oficial en español y los empareja con los datos en inglés. |
| `tools/build_spells.py` | Convierte el CSV de conjuros a `conjuros.json`. |
| `tools/build_srd_spells.py` | Extrae los conjuros del PDF oficial en español (`pdftotext`) y les pone el nombre en inglés de Open5e. |

## Contenido libre y libros opcionales
- De serie solo va contenido del **SRD 5.2.1** (CC-BY-4.0): bestiario y conjuros. Es lo único que se publica en abierto.
- Los manuales (Manual del Jugador, etc.) se añaden por usuario desde ✨ Conjuros → 📚 Libros opcionales, con un archivo CSV/JSON propio o un enlace. Se guardan solo en ese navegador y sustituyen al conjuro del SRD equivalente.
- La página también lee un `conjuros.json` junto a ella si existe; solo debe publicarse así en un artifact **privado**.
- Versión pública: la misma página con el título «Herramientas del Máster SRD» y solo `srd2024_es.json` + `conjuros_srd.json`.

## Probarlo en local
```
python -m http.server 8000
```
y abre http://localhost:8000. Los datos (combate, grupo, encuentros, criaturas propias) se guardan en el navegador.

## Versionado
Versionado semántico. Cada cambio actualiza `VERSION`, `CHANGELOG.md`, el historial de la página principal y crea una etiqueta git `vX.Y.Z`.

## Licencias
El contenido del SRD 5.2.1 se usa bajo CC-BY-4.0: «This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License.»
