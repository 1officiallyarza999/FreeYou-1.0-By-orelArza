import React, {useEffect, useState} from 'react';
import {
  View, Text, StatusBar, SafeAreaView, TouchableOpacity, I18nManager, AppState,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Mesh from './src/components/Mesh';
import Glass from './src/components/Glass';
import {StoreProvider, useStore, todayKey} from './src/store';
import HomeScreen from './src/screens/HomeScreen';
import ShieldScreen from './src/screens/ShieldScreen';
import MentorScreen from './src/screens/MentorScreen';
import GrowScreen from './src/screens/GrowScreen';
import MeScreen from './src/screens/MeScreen';
import JournalScreen from './src/screens/JournalScreen';
import MissionScreen from './src/screens/MissionScreen';
import SosScreen from './src/screens/SosScreen';
import UnlockScreen from './src/screens/UnlockScreen';
import Blocker, {BlockerEvents} from './src/native/Blocker';
import {T, F, W as WT} from './src/theme';

// עברית: כופה RTL בפעם הראשונה. דורש ריסטארט אחד אחרי התקנה.
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

const TABS = [
  {k: 'home', ic: '🔥', l: 'הבית'},
  {k: 'shield', ic: '🛡️', l: 'חוסם'},
  {k: 'mentor', ic: '🎙️', l: 'מנטור'},
  {k: 'grow', ic: '📈', l: 'בנייה'},
  {k: 'me', ic: '⚙️', l: 'אני'},
];

function Shell() {
  const {s, set, ready} = useStore();
  const [tab, setTab] = useState('home');
  const [overlay, setOverlay] = useState<string | null>(null);
  const [forced, setForced] = useState(false);

  /**
   * שני מסלולים לאותו אירוע:
   * 1. האפליקציה כבר חיה -> שידור מהשירות מגיע כאירוע.
   * 2. האפליקציה הייתה סגורה -> השירות שמר את היעד בדיסק, ואנחנו קוראים אותו כאן.
   * בלי המסלול השני, ניסיון כניסה בזמן שהאפליקציה סגורה היה נבלע.
   */
  const applyRoute = (e: {route: string; count: number}) => {
    set({attempts: {...s.attempts, [todayKey()]: e.count}});
    setForced(true);
    setOverlay(e.route === 'mission' ? 'mission' : 'journal');
    Blocker.clearPendingRoute();
  };

  useEffect(() => {
    const sub = BlockerEvents?.addListener('onBlockAttempt', applyRoute);
    Blocker.getPendingRoute().then(r => r && applyRoute(r));
    const app = AppState.addEventListener('change', st => {
      if (st === 'active') Blocker.getPendingRoute().then(r => r && applyRoute(r));
    });
    return () => {sub?.remove(); app.remove();};
  }, [s]);

  if (!ready) return <View style={{flex: 1, backgroundColor: T.ink}} />;

  const go = (r: string) => {
    if (['sos', 'journal', 'mission', 'unlock'].includes(r)) {
      if (r === 'journal') setForced(false);
      return setOverlay(r);
    }
    setTab(r);
  };
  const close = () => setOverlay(null);

  const Screen = () => {
    switch (tab) {
      case 'shield': return <ShieldScreen go={go} />;
      case 'mentor': return <MentorScreen />;
      case 'grow': return <GrowScreen />;
      case 'me': return <MeScreen />;
      default: return <HomeScreen go={go} />;
    }
  };

  const Overlay = () => {
    switch (overlay) {
      case 'journal': return <JournalScreen forced={forced} done={close} />;
      case 'mission': return <MissionScreen done={close} />;
      case 'sos': return <SosScreen go={r => {close(); setTab(r);}} close={close} />;
      case 'unlock': return <UnlockScreen close={close} />;
      default: return null;
    }
  };

  return (
    <View style={{flex: 1}}>
      <Mesh />
      <SafeAreaView style={{flex: 1}}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        {overlay ? (
          <View style={{flex: 1, padding: 18, backgroundColor: overlay === 'mission' ? 'rgba(30,2,12,0.72)' : 'rgba(5,5,7,0.72)'}}>
            <Overlay />
          </View>
        ) : (
          <>
            <View style={{flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', padding: 16}}>
              <View style={{flexDirection: 'row-reverse', alignItems: 'center', gap: 9}}>
                <View style={{width: 11, height: 11, borderRadius: 6, backgroundColor: T.lime}} />
                <Text style={{fontFamily: F.display, fontWeight: WT.display, fontSize: 19,
                  color: T.txt, letterSpacing: 2.5}}>FREEYOU</Text>
              </View>
              <Glass radius={100} padding={0} live>
                <Text style={{fontFamily: F.body, fontSize: 12, color: T.txt, paddingHorizontal: 12, paddingVertical: 7}}>
                  {s.strict ? 'מצב קפדני 🔒' : s.autoAdult || s.blocked.length ? 'מגן פעיל' : 'מגן כבוי'}
                </Text>
              </Glass>
            </View>

            <View style={{flex: 1, paddingHorizontal: 16}}>
              <Screen />
            </View>

            {tab !== 'mentor' && (
              <TouchableOpacity
                onPress={() => setTab('mentor')} activeOpacity={0.85}
                style={{position: 'absolute', bottom: 96, left: 20}}>
                <LinearGradient
                  colors={[T.violet, T.cyan]} start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                  style={{width: 60, height: 60, borderRadius: 30, alignItems: 'center',
                    justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.32)',
                    shadowColor: T.violet, shadowOpacity: 0.6, shadowRadius: 16,
                    shadowOffset: {width: 0, height: 8}, elevation: 12}}>
                  <Text style={{fontSize: 25}}>🎙️</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            <View style={{position: 'absolute', bottom: 14, left: 14, right: 14}}>
              <Glass radius={26} padding={7} live>
                <View style={{flexDirection: 'row-reverse'}}>
                  {TABS.map(t => (
                    <TouchableOpacity key={t.k} onPress={() => setTab(t.k)} activeOpacity={0.8}
                      style={{flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 19,
                        backgroundColor: tab === t.k ? 'rgba(255,255,255,0.16)' : 'transparent'}}>
                      <Text style={{fontSize: 19}}>{t.ic}</Text>
                      <Text style={{fontFamily: F.body, fontSize: 10.5, marginTop: 4,
                        color: tab === t.k ? T.txt : T.dimmer}}>{t.l}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Glass>
            </View>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
