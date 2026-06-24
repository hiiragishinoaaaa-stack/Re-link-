export type Lang = 'ja' | 'en'

export const translations = {
  ja: {
    // Home — header
    tagline: 'OGプレビューとランディングページ付きの短縮リンク',

    // Home — success banner
    linkCreated: 'リンクを作成しました！',
    directRedirect: '直接リダイレクト',
    landingPageUrl: 'ランディングページ',
    copy: 'コピー',
    copied: 'コピー済み！',

    // Home — slug field
    shortSlug: 'スラッグ',
    slugPlaceholder: 'my-link',
    slugHint: '半角英数字、ハイフン（-）、アンダースコア（_）のみ使用できます。',

    // Home — destination
    destinationUrl: 'リンク先URL',
    destinationPlaceholder: 'https://example.com/very/long/url',

    // Home — OG section
    ogSection: 'OGプレビュー（任意）',
    ogHint: 'Slack・iMessage・Twitterなどでシェアしたときに表示されます。',
    ogTitle: 'OGタイトル',
    ogTitlePlaceholder: 'おすすめのページ',
    ogDescription: 'OG説明文',
    ogDescriptionPlaceholder: 'リンクプレビューに表示される短い説明',
    ogImageUrl: 'OG画像URL',

    // Home — landing section
    landingSection: 'ランディングページ（任意）',
    landingHintBefore: '設定すると ',
    landingHintAfter: ' から専用ページを経由してリンク先に進めます。',
    landingTitle: 'タイトル',
    landingTitlePlaceholder: 'ようこそ！ぜひご覧ください。',
    landingDesc: '説明文',
    landingDescPlaceholder: 'ボタンの上に表示される短いメッセージ',
    landingImageUrl: '画像URL',
    buttonText: 'ボタンのテキスト',
    buttonTextPlaceholder: '続ける →',

    // Home — form actions
    creating: '作成中…',
    createLink: '短縮リンクを作成する',
    adminLink: '管理ダッシュボードを見る →',

    // Home — errors
    networkError: 'ネットワークエラーが発生しました。もう一度お試しください。',
    somethingWrong: 'エラーが発生しました。',

    // Admin — header
    adminTitle: '管理ダッシュボード',
    adminSubtitle: '短縮リンクの管理',
    newLink: '+ 新規リンク',

    // Admin — stats
    totalLinks: 'リンク数',
    totalClicks: '総クリック数',
    topLink: '人気リンク',

    // Admin — states
    loading: '読み込み中…',
    retry: '再試行',
    noLinks: 'リンクがまだありません。',
    createFirstLink: '最初のリンクを作成する →',

    // Admin — table headers
    colShortLink: '短縮リンク',
    colDestination: 'リンク先',
    colOgTitle: 'OGタイトル',
    colLanding: 'ランディングページ',
    colClicks: 'クリック数',
    colCreated: '作成日',

    // Admin — delete
    deleteConfirm: 'このリンクを削除しますか？',
    delete: '削除',
    deleting: '…',

    // Admin — errors
    failedToLoad: 'リンクの読み込みに失敗しました。',
    failedToDelete: 'リンクの削除に失敗しました。',
    serverError: 'サーバーエラー: ',
    deleteFailed: '削除に失敗しました: ',

    // Landing page chrome (UI only — button text/title/description are user content)
    buttonLoading: '読み込み中…',
    buttonDefault: '続ける',

    // Image upload
    uploadImage: 'アップロード',
    uploading: 'アップロード中…',
    uploadError: 'アップロードに失敗しました。',
    uploadHint: 'JPEG・PNG・GIF・WebP・SVG　最大 5 MB',

    // Auth — labels & buttons
    signIn: 'ログイン',
    signingIn: 'ログイン中…',
    signUp: 'アカウント作成',
    signingUp: '作成中…',
    signOut: 'ログアウト',
    email: 'メールアドレス',
    password: 'パスワード',
    forgotPassword: 'パスワードを忘れた方',
    resetPassword: 'パスワードをリセット',
    sendResetEmail: 'リセットメールを送信する',
    sendingEmail: '送信中…',
    newPassword: '新しいパスワード',
    updatePassword: 'パスワードを更新する',
    updatingPassword: '更新中…',
    backToLogin: 'ログインに戻る',
    noAccount: 'アカウントをお持ちでない方はこちら',
    haveAccount: 'すでにアカウントをお持ちの方はこちら',

    // Auth — messages
    signUpSuccess: '確認メールを送信しました。メールを確認してアカウントを有効化してください。',
    resetEmailSent: 'パスワードリセット用のメールを送信しました。メールをご確認ください。',
    passwordUpdated: 'パスワードを更新しました。ログインしてください。',
    invalidCredentials: 'メールアドレスまたはパスワードが正しくありません。',
    authError: '認証エラーが発生しました。もう一度お試しください。',

    // Auth — UI
    adminBadge: '管理者',
    loggedInAs: 'ログイン中：',

    // Redirect method selector
    redirectMethod: '遷移方式',
    methodJsReplace: 'JS replace（デフォルト）',
    methodJsHref: 'TikTok用リンク',
    methodNormalLink: '通常リンク',
    methodMetaRefresh: 'メタリフレッシュ（自動）',
    methodAndroidIntent: 'Android Intent（TikTok Lite）',
    methodRedirect302: 'サーバーリダイレクト',

    // Admin — new columns
    colViews: 'LP表示',
    colCtr: 'CTR',
    colMethod: '遷移方式',
    totalViews: '総表示数',

    // Language switcher
    langJa: '日本語',
    langEn: 'English',
  },

  en: {
    // Home — header
    tagline: 'Short links with custom OG previews and landing pages',

    // Home — success banner
    linkCreated: 'Link created!',
    directRedirect: 'Direct redirect',
    landingPageUrl: 'Landing page',
    copy: 'Copy',
    copied: 'Copied!',

    // Home — slug field
    shortSlug: 'Short slug',
    slugPlaceholder: 'my-link',
    slugHint: 'Letters, numbers, hyphens and underscores only.',

    // Home — destination
    destinationUrl: 'Destination URL',
    destinationPlaceholder: 'https://example.com/very/long/url',

    // Home — OG section
    ogSection: 'OG Preview (optional)',
    ogHint: 'Shown when this link is shared on Slack, iMessage, Twitter, etc.',
    ogTitle: 'OG Title',
    ogTitlePlaceholder: 'My awesome page',
    ogDescription: 'OG Description',
    ogDescriptionPlaceholder: 'A short description shown in link previews',
    ogImageUrl: 'OG Image URL',

    // Home — landing section
    landingSection: 'Landing Page (optional)',
    landingHintBefore: 'When set, visitors can access ',
    landingHintAfter: ' — a branded page before they proceed.',
    landingTitle: 'Title',
    landingTitlePlaceholder: 'Welcome! Check this out.',
    landingDesc: 'Description',
    landingDescPlaceholder: 'A short message shown above the button.',
    landingImageUrl: 'Image URL',
    buttonText: 'Button text',
    buttonTextPlaceholder: 'Continue →',

    // Home — form actions
    creating: 'Creating…',
    createLink: 'Create short link',
    adminLink: 'View admin dashboard →',

    // Home — errors
    networkError: 'Network error — please try again.',
    somethingWrong: 'Something went wrong.',

    // Admin — header
    adminTitle: 'Admin Dashboard',
    adminSubtitle: 'Manage your short links',
    newLink: '+ New link',

    // Admin — stats
    totalLinks: 'Total links',
    totalClicks: 'Total clicks',
    topLink: 'Top link',

    // Admin — states
    loading: 'Loading…',
    retry: 'Retry',
    noLinks: 'No links yet.',
    createFirstLink: 'Create your first link →',

    // Admin — table headers
    colShortLink: 'Short link',
    colDestination: 'Destination',
    colOgTitle: 'OG title',
    colLanding: 'Landing page',
    colClicks: 'Clicks',
    colCreated: 'Created',

    // Admin — delete
    deleteConfirm: 'Delete this link?',
    delete: 'Delete',
    deleting: '…',

    // Admin — errors
    failedToLoad: 'Failed to load links.',
    failedToDelete: 'Failed to delete link.',
    serverError: 'Server error: ',
    deleteFailed: 'Delete failed: ',

    // Landing page chrome
    buttonLoading: 'Loading…',
    buttonDefault: 'Continue',

    // Image upload
    uploadImage: 'Upload image',
    uploading: 'Uploading…',
    uploadError: 'Upload failed.',
    uploadHint: 'JPEG, PNG, GIF, WebP or SVG — max 5 MB',

    // Auth — labels & buttons
    signIn: 'Log in',
    signingIn: 'Logging in…',
    signUp: 'Sign up',
    signingUp: 'Creating account…',
    signOut: 'Log out',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot password?',
    resetPassword: 'Reset password',
    sendResetEmail: 'Send reset email',
    sendingEmail: 'Sending…',
    newPassword: 'New password',
    updatePassword: 'Update password',
    updatingPassword: 'Updating…',
    backToLogin: 'Back to log in',
    noAccount: "Don't have an account? Sign up",
    haveAccount: 'Already have an account? Log in',

    // Auth — messages
    signUpSuccess: 'Check your email to confirm your account.',
    resetEmailSent: 'Password reset email sent. Check your inbox.',
    passwordUpdated: 'Password updated. Please log in.',
    invalidCredentials: 'Invalid email or password.',
    authError: 'Authentication error. Please try again.',

    // Auth — UI
    adminBadge: 'Admin',
    loggedInAs: 'Logged in as ',

    // Redirect method selector
    redirectMethod: 'Redirect method',
    methodJsReplace: 'JS replace (default)',
    methodJsHref: 'TikTok link',
    methodNormalLink: 'Normal link',
    methodMetaRefresh: 'Meta refresh (auto)',
    methodAndroidIntent: 'Android Intent (TikTok Lite)',
    methodRedirect302: 'Server redirect',

    // Admin — new columns
    colViews: 'Views',
    colCtr: 'CTR',
    colMethod: 'Method',
    totalViews: 'Total views',

    // Language switcher
    langJa: '日本語',
    langEn: 'English',
  },
} as const

export type Translations = { readonly [K in keyof typeof translations['ja']]: string }
