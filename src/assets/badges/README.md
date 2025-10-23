このフォルダには、ミッション達成で獲得できるバッジ画像を保存します。

推奨ファイル例:
- dinner_cook_badge.png （夕食自炊回数達成）
- lunch_cook_badge.png （昼食自炊・弁当回数達成）
- weekly_action_badge.png （ウィークリーアクション達成）

使用例（React Native Image）:
```tsx
<Image source={require('./dinner_cook_badge.png')} />
```

注意:
- 解像度は @1x/@2x/@3x を用意できると高DPI端末で綺麗に表示されます。

