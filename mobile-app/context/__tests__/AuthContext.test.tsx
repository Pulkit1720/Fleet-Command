import React from 'react';
import { Text } from 'react-native';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(),
  },
}));

const mockGetSession = supabase.auth.getSession as jest.Mock;
const mockOnAuthStateChange = supabase.auth.onAuthStateChange as jest.Mock;
const mockSignInWithPassword = supabase.auth.signInWithPassword as jest.Mock;
const mockSignOut = supabase.auth.signOut as jest.Mock;
const mockFrom = supabase.from as jest.Mock;

function TestConsumer() {
  const { technician, isLoading, signIn, signOut } = useAuth();
  return (
    <>
      <Text testID="loading">{isLoading ? 'loading' : 'ready'}</Text>
      <Text testID="technician">{technician?.full_name ?? 'none'}</Text>
      <Text
        testID="sign-in"
        onPress={async () => {
          const err = await signIn('tech@test.com', 'password');
          if (err) {
            // surface error in test via testID
          }
        }}
      >
        sign-in
      </Text>
      <Text testID="sign-out" onPress={() => signOut()}>
        sign-out
      </Text>
    </>
  );
}

describe('AuthContext', () => {
  const unsubscribe = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe } },
    });
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  it('starts in loading state then becomes ready with no session', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading').props.children).toBe('loading');

    await waitFor(() => {
      expect(screen.getByTestId('loading').props.children).toBe('ready');
    });
    expect(screen.getByTestId('technician').props.children).toBe('none');
  });

  it('loads technician profile when session exists', async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: { user: { id: 'user-1' } },
      },
    });

    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'tech-1',
          full_name: 'Jane Tech',
          email: 'jane@test.com',
          phone: null,
          avatar_url: null,
          is_active: true,
        },
        error: null,
      }),
    };
    mockFrom.mockReturnValue(chain);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('technician').props.children).toBe('Jane Tech');
    });
    expect(mockFrom).toHaveBeenCalledWith('technicians');
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('signIn returns error message on failure', async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    });

    let signInResult: string | null = 'pending';
    function SignInProbe() {
      const { signIn } = useAuth();
      return (
        <Text
          testID="probe"
          onPress={async () => {
            signInResult = await signIn('bad@test.com', 'wrong');
          }}
        >
          probe
        </Text>
      );
    }

    render(
      <AuthProvider>
        <SignInProbe />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('probe')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('probe'));
    });

    await waitFor(() => {
      expect(signInResult).toBe('Invalid login credentials');
    });
  });

  it('signIn returns null on success', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });

    let signInResult: string | null = 'pending';
    function SignInProbe() {
      const { signIn } = useAuth();
      return (
        <Text
          testID="probe"
          onPress={async () => {
            signInResult = await signIn('tech@test.com', 'secret');
          }}
        >
          probe
        </Text>
      );
    }

    render(
      <AuthProvider>
        <SignInProbe />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('probe')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('probe'));
    });

    await waitFor(() => {
      expect(signInResult).toBeNull();
    });
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'tech@test.com',
      password: 'secret',
    });
  });

  it('signOut calls supabase auth signOut', async () => {
    mockSignOut.mockResolvedValue({ error: null });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('sign-out')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('sign-out'));
    });

    expect(mockSignOut).toHaveBeenCalled();
  });

  it('unsubscribes from auth listener on unmount', async () => {
    const { unmount } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').props.children).toBe('ready');
    });

    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
