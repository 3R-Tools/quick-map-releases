# Quick Map — releases

Публічні збірки десктопного застосунку **Quick Map** та маніфести автооновлення.

Вихідний код тут не публікується — цей репозиторій містить лише артефакти збірки.

## Завантажити

Найсвіжіша версія: **[Releases](https://github.com/3R-Tools/quick-map-releases/releases/latest)**

| Платформа | Файл |
|---|---|
| macOS (Apple Silicon) | `QuickMap-<версія>-mac-arm64.dmg` |
| macOS (Intel) | `QuickMap-<версія>-mac-x64.dmg` |
| Windows | `QuickMap-<версія>-win-x64.exe` |
| Linux | `QuickMap-<версія>-linux-x86_64.AppImage` або `.deb` |
| Офлайн веб-версія | `quick-map-offline-<версія>.zip` |

## Автооновлення

Застосунок перевіряє оновлення сам і оновлюється з цих релізів.
Файли `latest-mac.yml`, `latest.yml`, `latest-linux.yml` потрібні для роботи
`electron-updater` — не видаляйте їх з релізу.
