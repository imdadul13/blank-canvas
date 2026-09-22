import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AudioRecallController, AudioRecallItem } from '../audioRecallEngine';

describe('Hands-Free Audio Recall Engine', () => {
  const sampleItems: AudioRecallItem[] = [
    {
      id: 'pearl-1',
      name: 'Beck Triad',
      components: 'Hypotension, Muffled heart sounds, Distended jugular veins',
      diagnosis: 'Cardiac Tamponade',
      subject: 'Medicine',
    },
    {
      id: 'pearl-2',
      name: 'Charcot Triad',
      components: 'Fever, Jaundice, Right Upper Quadrant abdominal pain',
      diagnosis: 'Acute Cholangitis',
      subject: 'Surgery',
    },
    {
      id: 'pearl-3',
      name: 'Virchow Triad',
      components: 'Endothelial injury, Stasis of blood flow, Hypercoagulability',
      diagnosis: 'Deep Venous Thrombosis',
      subject: 'Pathology',
    },
  ];

  it('1. Initializes with empty or provided items and default playback params', () => {
    const controller = new AudioRecallController(sampleItems, 1.25);
    const state = controller.getState();

    assert.equal(state.totalItems, 3);
    assert.equal(state.currentIndex, 0);
    assert.equal(state.playbackRate, 1.25);
    assert.equal(state.recallPauseSeconds, 4);
    assert.equal(state.isPlaying, false);
    assert.equal(state.phase, 'idle');
    assert.equal(state.currentItem?.id, 'pearl-1');
  });

  it('2. Rate and pause configuration updates propagate cleanly', () => {
    const controller = new AudioRecallController(sampleItems);
    controller.setPlaybackRate(1.5);
    controller.setRecallPauseSeconds(6);

    const state = controller.getState();
    assert.equal(state.playbackRate, 1.5);
    assert.equal(state.recallPauseSeconds, 6);
  });

  it('3. Navigation (next / previous) cycles predictably across the playlist', () => {
    const controller = new AudioRecallController(sampleItems);

    controller.next();
    assert.equal(controller.getState().currentIndex, 1);
    assert.equal(controller.getState().currentItem?.id, 'pearl-2');

    controller.next();
    assert.equal(controller.getState().currentIndex, 2);
    assert.equal(controller.getState().currentItem?.id, 'pearl-3');

    // Loops back to start
    controller.next();
    assert.equal(controller.getState().currentIndex, 0);

    // Loops back to end
    controller.previous();
    assert.equal(controller.getState().currentIndex, 2);
  });

  it('4. Subscribe listener receives live state updates and unsubscription stops updates', () => {
    const controller = new AudioRecallController(sampleItems);
    const recordedPhases: string[] = [];

    const unsubscribe = controller.subscribe((state) => {
      recordedPhases.push(state.phase);
    });

    // Initial phase emitted on subscribe
    assert.equal(recordedPhases.length, 1);
    assert.equal(recordedPhases[0], 'idle');

    controller.pause();
    assert.equal(recordedPhases[recordedPhases.length - 1], 'stopped');

    unsubscribe();
    controller.stop();
    // No new events recorded after unsubscribing
    assert.equal(recordedPhases[recordedPhases.length - 1], 'stopped');
  });

  it('5. Dynamic item updates with setItems', () => {
    const controller = new AudioRecallController();
    assert.equal(controller.getState().totalItems, 0);

    controller.setItems(sampleItems);
    assert.equal(controller.getState().totalItems, 3);
    assert.equal(controller.getState().currentItem?.name, 'Beck Triad');
  });
});
