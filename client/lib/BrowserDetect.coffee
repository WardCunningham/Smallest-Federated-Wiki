# taken from - https://github.com/rahul/js.browser-detection/blob/master/browser-detection.coffee
# Granted under MIT license

window.browser =
  initialize: (user_agent) ->
    user_agent = null unless user_agent?
    @user_agent = (if user_agent then user_agent else navigator.userAgent)

  accept_language: ->
    'use strict'
    @LANGUAGES[(navigator.userLanguage or navigator.language or 'en-US').toLowerCase()]

  NAMES:
    android: 'Android'
    blackberry: 'BlackBerry'
    chrome: 'Chrome'
    firefox: 'Firefox'
    ie: 'Internet Explorer'
    ipad: 'iPad'
    iphone: 'iPhone'
    ipod: 'iPod Touch'
    opera: 'Opera'
    other: 'Other'
    safari: 'Safari'
    psp: 'PlayStation Portable'
    quicktime: 'QuickTime'
    core_media: 'Apple CoreMedia'

  VERSIONS:
    _default: /(?:Version|MSIE|Firefox|Chrome|QuickTime|BlackBerry[^\/]+|CoreMedia v)[\/ ]?([a-z0-9.]+)/i
    opera: /Opera\/.*? Version\/([\d.]+)/

  TRIDENT_VERSION_REGEX: /Trident\/([0-9.]+)/
  LANGUAGES:
    af: 'Afrikaans'
    sq: 'Albanian'
    eu: 'Basque'
    bg: 'Bulgarian'
    be: 'Byelorussian'
    ca: 'Catalan'
    zh: 'Chinese'
    'zh-cn': 'Chinese/China'
    'zh-tw': 'Chinese/Taiwan'
    'zh-hk': 'Chinese/Hong Kong'
    'zh-sg': 'Chinese/singapore'
    hr: 'Croatian'
    cs: 'Czech'
    da: 'Danish'
    nl: 'Dutch'
    'nl-nl': 'Dutch/Netherlands'
    'nl-be': 'Dutch/Belgium'
    en: 'English'
    'en-gb': 'English/United Kingdom'
    'en-us': 'English/United States'
    'en-au': 'English/Australian'
    'en-ca': 'English/Canada'
    'en-nz': 'English/New Zealand'
    'en-ie': 'English/Ireland'
    'en-za': 'English/South Africa'
    'en-jm': 'English/Jamaica'
    'en-bz': 'English/Belize'
    'en-tt': 'English/Trinidad'
    et: 'Estonian'
    fo: 'Faeroese'
    fa: 'Farsi'
    fi: 'Finnish'
    fr: 'French'
    'fr-be': 'French/Belgium'
    'fr-fr': 'French/France'
    'fr-ch': 'French/Switzerland'
    'fr-ca': 'French/Canada'
    'fr-lu': 'French/Luxembourg'
    gd: 'Gaelic'
    gl: 'Galician'
    de: 'German'
    'de-at': 'German/Austria'
    'de-de': 'German/Germany'
    'de-ch': 'German/Switzerland'
    'de-lu': 'German/Luxembourg'
    'de-li': 'German/Liechtenstein'
    el: 'Greek'
    he: 'Hebrew'
    'he-il': 'Hebrew/Israel'
    hi: 'Hindi'
    hu: 'Hungarian'
    'ie-ee': 'Internet Explorer/Easter Egg'
    is: 'Icelandic'
    id: 'Indonesian'
    in: 'Indonesian'
    ga: 'Irish'
    it: 'Italian'
    'it-ch': 'Italian/ Switzerland'
    ja: 'Japanese'
    km: 'Khmer'
    'km-kh': 'Khmer/Cambodia'
    ko: 'Korean'
    lv: 'Latvian'
    lt: 'Lithuanian'
    mk: 'Macedonian'
    ms: 'Malaysian'
    mt: 'Maltese'
    no: 'Norwegian'
    pl: 'Polish'
    pt: 'Portuguese'
    'pt-br': 'Portuguese/Brazil'
    rm: 'Rhaeto-Romanic'
    ro: 'Romanian'
    'ro-mo': 'Romanian/Moldavia'
    ru: 'Russian'
    'ru-mo': 'Russian /Moldavia'
    # gd : 'Scots Gaelic
    sr: 'Serbian'
    sk: 'Slovack'
    sl: 'Slovenian'
    sb: 'Sorbian'
    es: 'Spanish'
    'es-do': 'Spanish'
    'es-ar': 'Spanish/Argentina'
    'es-co': 'Spanish/Colombia'
    'es-mx': 'Spanish/Mexico'
    'es-es': 'Spanish/Spain'
    'es-gt': 'Spanish/Guatemala'
    'es-cr': 'Spanish/Costa Rica'
    'es-pa': 'Spanish/Panama'
    'es-ve': 'Spanish/Venezuela'
    'es-pe': 'Spanish/Peru'
    'es-ec': 'Spanish/Ecuador'
    'es-cl': 'Spanish/Chile'
    'es-uy': 'Spanish/Uruguay'
    'es-py': 'Spanish/Paraguay'
    'es-bo': 'Spanish/Bolivia'
    'es-sv': 'Spanish/El salvador'
    'es-hn': 'Spanish/Honduras'
    'es-ni': 'Spanish/Nicaragua'
    'es-pr': 'Spanish/Puerto Rico'
    sx: 'Sutu'
    sv: 'Swedish'
    'sv-se': 'Swedish/Sweden'
    'sv-fi': 'Swedish/Finland'
    ts: 'Thai'
    tn: 'Tswana'
    tr: 'Turkish'
    uk: 'Ukrainian'
    ur: 'Urdu'
    vi: 'Vietnamese'
    xh: 'Xshosa'
    ji: 'Yiddish'
    zu: 'Zulu'

  # Get readable browser name.
  name: ->
    'use strict'
    @NAMES[@id()]

  # Return a symbol that identifies the browser.
  id: ->
    'use strict'

    if @is_chrome()
     'chrome'
    else if @on_iphone()
     'iphone'
    else if @on_ipad()
     'ipad'
    else if @on_ipod()
     'ipod'
    else if @is_ie()
     'ie'
    else if @is_opera()
     'opera'
    else if @is_firefox()
     'firefox'
    else if @on_android()
     'android'
    else if @on_blackberry()
     'blackberry'
    else if @is_safari()
     'safari'
    else if @on_psp()
     'psp'
    else if @is_quicktime()
     'quicktime'
    else if @is_core_media()
     'core_media'
    else
     'other'

  # Return major version.
  version: ->
    'use strict'
    @full_version().toString().split('.')[0]

  # Return the full version.
  full_version: ->
    'use strict'

    id = @id()
    version = null

    id = '_default' if id isnt 'opera'
    version = @user_agent.match(@VERSIONS[id])
    version = RegExp.$1 if version isnt null

    version or '0.0'

  version_gt: (lower_bound) ->
    'uses strict'
    parseInt(@version(), 10) > lower_bound

  version_lt: (upper_bound) ->
    'uses strict'
    parseInt(@version(), 10) < upper_bound

  # Return true if browser supports some CSS 3 (Safari, Firefox, Opera & IE7+).
  is_capable: ->
    'use strict'
    @uses_webkit() or @is_firefox() or @is_opera() or (@is_ie() and parseInt(@version, 10) >= 7)

  has_compatibility_view: ->
    'use strict'
    @is_ie() and @user_agent.match(@TRIDENT_VERSION_REGEX) and (parseInt(@version(), 10) < (parseInt(RegExp.$1, 10) + 4))

  # Detect if browser is WebKit-based.
  uses_webkit: ->
    'use strict'
    !!@user_agent.match(/AppleWebKit/i)

  # Detect if browser is ios?.
  on_ios: ->
    'use strict'
    @on_ipod() or @on_ipad() or @on_iphone()

  # Detect if browser is mobile.
  on_mobile: ->
    'use strict'
    !!@user_agent.match(/(Mobi(le)?|Symbian|MIDP|Windows CE)/) or @on_blackberry() or @on_psp() or @is_opera_mini()

  # Detect if browser is QuickTime
  is_quicktime: ->
    'use strict'
    !!@user_agent.match(/QuickTime/i)

  # Detect if browser is BlackBerry
  on_blackberry: ->
    'use strict'
    !!@user_agent.match(/BlackBerry/)

  # Detect if browser is Android.
  on_android: ->
    'use strict'
    !!@user_agent.match(/Android/) and not @is_opera()

  # Detect if browser is Apple CoreMedia.
  is_core_media: ->
    'use strict'
    !!@user_agent.match(/CoreMedia/)

  # Detect if browser is iPhone.
  on_iphone: ->
    'use strict'
    !!@user_agent.match(/iPhone/)

  # Detect if browser is iPad.
  on_ipad: ->
    'use strict'
    !!@user_agent.match(/iPad/)

  # Detect if browser is iPod.
  on_ipod: ->
    'use strict'
    !!@user_agent.match(/iPod/)

  # Detect if browser is Safari.
  is_safari: ->
    'use strict'
    @user_agent.match(/Safari/) and not @user_agent.match(/Chrome/)

  # Detect if browser is Firefox.
  is_firefox: ->
    'use strict'
    !!@user_agent.match(/Firefox/)

  # Detect if browser is Chrome.
  is_chrome: ->
    'use strict'
    !!@user_agent.match(/Chrome/)

  # Detect if browser is Internet Explorer.
  is_ie: ->
    'use strict'
    !!@user_agent.match(/MSIE/) and not @user_agent.match(/Opera/)

  # Detect if browser is Internet Explorer 6.
  is_ie6: ->
    'use strict'
    @is_ie() and @version() is '6'

  # Detect if browser is Internet Explorer 7.
  is_ie7: ->
    'use strict'
    @is_ie() and @version() is '7'

  # Detect if browser is Internet Explorer 8.
  is_ie8: ->
    'use strict'
    @is_ie() and @version() is '8'

  # Detect if browser is Internet Explorer 9.
  is_ie9: ->
    'use strict'
    @is_ie() and @version() is '9'

  # Detect if browser is running from PSP.
  on_psp: ->
    'use strict'
    !!@user_agent.match(/PSP/)

  # Detect if browser is Opera.
  is_opera: ->
    'use strict'
    !!@user_agent.match(/Opera/)

  # Detect if browser is Opera Mini.
  is_opera_mini: ->
    'use strict'
    !!@user_agent.match(/Opera Mini/)

  # Detect if current platform is Macintosh.
  on_mac: ->
    'use strict'
    !!@user_agent.match(/Mac OS X/)

  # Detect if current platform is Windows.
  on_windows: ->
    'use strict'
    !!@user_agent.match(/Windows/)

  # Detect if current platform is Linux flavor.
  on_linux: ->
    'use strict'
    !!@user_agent.match(/Linux/)

  # Detect if browser is tablet (currently just iPad or Android).
  on_tablet: ->
    'use strict'
    @on_ipad() or (@on_android() and not @on_mobile())

  # Detect if browser is Kindle.
  on_kindle: ->
    'use strict'
    !!@user_agent.match(/Kindle/)

  # Return the platform.
  platform: ->
    'use strict'

    if @on_linux()
     'linux'
    else if @on_mac()
     'mac'
    else if @on_windows()
     'windows'
    else
     'other'

  # Return a meta info about this browser.
  meta: ->
    'use strict'

    meta_data = []

    meta_data.push @id()
    meta_data.push 'webkit' if @uses_webkit()
    meta_data.push 'ios' if @on_ios()
    meta_data.push 'safari safari' + @version() if @is_safari()
    meta_data.push @id() + @version() unless @is_safari() or @is_chrome()
    meta_data.push @platform()
    meta_data.push 'capable' if @is_capable()
    meta_data.push 'mobile' if @on_mobile()

    meta_data

  # Return meta representation as string.
  to_string: ->
    'use strict'
    @meta().join ' '

# Prepare the browser object
window.browser.initialize()


module.exports = browser = {}

