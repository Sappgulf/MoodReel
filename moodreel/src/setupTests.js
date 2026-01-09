// Jest setup file for MoodReel tests
// This file is automatically run before all tests

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn((key) => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock matchMedia (for theme detection)
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Mock AudioContext (for sound effects)
class MockAudioContext {
    createOscillator() {
        return {
            connect: jest.fn(),
            start: jest.fn(),
            stop: jest.fn(),
            frequency: { value: 0 },
            type: 'sine',
        };
    }
    createGain() {
        return {
            connect: jest.fn(),
            gain: {
                setValueAtTime: jest.fn(),
                exponentialRampToValueAtTime: jest.fn(),
            },
        };
    }
    get destination() {
        return {};
    }
}
window.AudioContext = MockAudioContext;
window.webkitAudioContext = MockAudioContext;

// Reset mocks between tests
beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockImplementation(() => null);
});
