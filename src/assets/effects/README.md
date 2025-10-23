このフォルダには、ミッション達成エフェクトで使用するアニメーション（例: 紙吹雪GIF など）を保存します。

推奨ファイル例:
- confetti.gif （紙吹雪）
- fireworks.gif （花火）

使用例（React Native Image）:
```tsx
<Image source={require('./confetti.gif')} />
```

注意:
- 端末性能により大きなGIFは負荷になるため、最適化（解像度・容量）を推奨します。

