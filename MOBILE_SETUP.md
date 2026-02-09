# Mobile (Capacitor) Setup — BlaBlaBla

Este guia mostra os passos rápidos para empacotar o frontend web existente com Capacitor (Android + iOS).

Observações importantes
- iOS builds exigem macOS + Xcode.
- Firebase Auth requer configurar SHA-1/256 (Android) e URL schemes (iOS) para OAuth redirect.
- Teste YouTube IFrame em dispositivos reais (autoplay/background audio têm restrições).

1) Instalar dependências (no root do projeto)

Windows / Linux (Android):
```bash
# no diretório raiz do projeto
npm install --save-dev @capacitor/cli @capacitor/core
```

macOS (para suporte iOS você também fará o mesmo)

2) Inicializar Capacitor

```bash
# inicializa o Capacitor (substitua appId/appName como desejar)
npx @capacitor/cli@latest init "BlaBlaBla" com.yourcompany.blablabla --web-dir=./
```

Explicação: `--web-dir=./` usa o diretório atual (onde estão `index.html`/`app.html`).
Recomendação: crie uma pasta `www/` com a versão de produção do frontend e use `--web-dir=www`.

3) Adicionar plataformas

Android (no Windows/macOS):
```bash
npx cap add android
```

iOS (apenas macOS):
```bash
npx cap add ios
```

4) Copiar assets web e abrir IDEs

```bash
# sempre que atualizar o frontend
npx cap copy

# abrir Android Studio
npx cap open android

# abrir Xcode (macOS)
npx cap open ios
```

5) Configurar Firebase Auth
- No console Firebase > Auth > Configurar método de login: adicione o URL de redirecionamento para Android/iOS.
- Android: gere SHA-1/256 e adicione nas configurações do app no Firebase.
- iOS: configure o URL scheme (ex.: `com.googleusercontent.apps.YOUR_CLIENT_ID`) e adicione o `REVERSED_CLIENT_ID` no Info.plist.

6) YouTube IFrame / Background audio
- iOS (WKWebView): autoplay geralmente bloqueado; exija interação do usuário para iniciar áudio.
- Para background audio: configure Background Modes (Audio) em Xcode e implemente AVAudioSession se necessário.
- Android: para reprodução contínua, considere um `Foreground Service` nativo para garantir que o áudio continue em background.

7) Push notifications
- Use Capacitor Push / FCM. No Firebase Console, gere credenciais APNs (iOS) e a key JSON para Android.

8) Build final
- Android: gerar `aab` via Android Studio (Build > Generate Signed Bundle / APK).
- iOS: arquivar e subir via Xcode Organizer (necessita Apple Developer account).

Comandos úteis resumidos

```bash
# instalar Capacitor (root)
npm install --save-dev @capacitor/cli @capacitor/core

# init
npx @capacitor/cli@latest init "BlaBlaBla" com.yourcompany.blablabla --web-dir=./

# adicionar plataformas
npx cap add android
npx cap add ios     # macOS only

# copiar assets
npx cap copy

# abrir IDEs
npx cap open android
npx cap open ios    # macOS only
```

Próximos passos que eu posso executar para você:
- Gerar `capacitor.config.json` template e `package.json` com scripts úteis.
- Adicionar um `www/` simples contendo `index.html`/`app.html` copiados ou instruções para build.
- Criar instruções detalhadas para configurar Firebase Auth (SHA / URL schemes).

Diga qual desses quer que eu faça agora e eu gero os arquivos/instruções correspondentes.