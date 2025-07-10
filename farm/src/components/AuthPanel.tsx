import { useState, useEffect } from 'react';
import { auth, db, provider } from '../firebase';
import { signInWithPopup, signOut, User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function AuthPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // 1. test 컬렉션 테스트
          const testDoc = doc(db, 'test', 'connection');
          await setDoc(testDoc, { 
            timestamp: Date.now(),
            user: firebaseUser.uid 
          });
          
          // 2. farmGame 컬렉션 - 기존 데이터가 없을 때만 초기화
          const farmDoc = doc(db, 'farmGame', firebaseUser.uid);
          const farmSnapshot = await getDoc(farmDoc);
          
          if (!farmSnapshot.exists()) {
            // 새 사용자인 경우에만 기본 데이터 생성
            await setDoc(farmDoc, {
              tiles: [],
              inventory: {},
              gold: 100,
              lastUpdated: Date.now(),
              version: 1
            });
            console.log('🆕 새 사용자 기본 데이터 생성');
          } else {
            console.log('🔄 기존 사용자 데이터 유지');
          }
          
          setConnectionStatus('connected');
          console.log('✅ Firebase 연결 성공 (test + farmGame)');
        } catch (error) {
          setConnectionStatus('error');
          console.error('❌ Firebase 연결 실패:', error);
          
          // 자세한 오류 정보 출력
          if (error instanceof Error) {
            console.error('오류 메시지:', error.message);
            console.error('오류 코드:', (error as any).code);
          }
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('로그인 실패:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  return (
    <div style={{ 
      padding: '1rem', 
      background: '#2a2a2a', 
      borderRadius: '8px', 
      marginBottom: '1rem',
      border: '1px solid #444'
    }}>
      {user ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <img 
              src={user.photoURL || ''} 
              alt="프로필" 
              style={{ width: '24px', height: '24px', borderRadius: '50%' }}
            />
            <span>안녕하세요, {user.displayName}님!</span>
            {connectionStatus === 'connected' && (
              <span style={{ color: '#22c55e', fontSize: '12px' }}>🟢 연결됨</span>
            )}
            {connectionStatus === 'error' && (
              <span style={{ color: '#ef4444', fontSize: '12px' }}>🔴 연결 실패</span>
            )}
            {connectionStatus === 'connecting' && (
              <span style={{ color: '#fbbf24', fontSize: '12px' }}>🟡 연결 중...</span>
            )}
          </div>
          <button onClick={handleLogout}>
            로그아웃
          </button>
        </>
      ) : (
        <>
          <p>🌾 농장 게임에 오신 것을 환영합니다!</p>
          <p style={{ fontSize: '14px', color: '#aaa', margin: '0.25rem 0' }}>
            로그인하면 농장 데이터가 자동으로 저장되어 언제든지 이어서 플레이할 수 있습니다.
          </p>
          <button onClick={handleLogin}>
            🔑 Google 로그인으로 시작하기
          </button>
        </>
      )}
    </div>
  );
}