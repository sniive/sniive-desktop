# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['script.py'],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='sniive-script',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity='B3F96175F05FB619D9973C8BED9E3415490519C6',
    entitlements_file='entitlements.plist',
    icon=['../icons/sniive-script/icon.icns'],
)
app = BUNDLE(
    exe,
    name='sniive-script.app',
    icon='../icons/sniive-script/icon.icns',
    bundle_identifier='com.script.sniive',
)
