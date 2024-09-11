use std::time::SystemTime;

use crabgrab::util::Rect;

#[derive(Clone, Copy, Debug)]
pub struct MousePosition {
    pub x: f64,
    pub y: f64,
}
#[derive(Clone, Copy, Debug)]
pub struct InputEvent {
    pub event: rdev::EventType,
    pub mouse_position: MousePosition,
}

#[derive(Clone, Copy, Debug)]
pub struct MouseEvent {
    pub button: rdev::Button,
    pub mouse_position: MousePosition,
    pub display_rect: Rect,
}
#[derive(Clone, Copy, Debug)]
pub struct KeyboardEvent {
    pub key: rdev::Key,
}
#[derive(Clone, Copy, Debug)]
pub enum Event {
    MouseEvent(MouseEvent),
    KeyboardEvent(KeyboardEvent),
}

#[derive(Clone, Debug)]
pub struct StateMachineResult {
    pub events: Vec<Event>,
    pub start_time: SystemTime,
    pub end_time: SystemTime,
}

pub fn is_special(key: &rdev::Key) -> bool {
    match key {
        rdev::Key::Return => true,
        rdev::Key::ShiftLeft => true,
        rdev::Key::ShiftRight => true,
        rdev::Key::ControlLeft => true,
        rdev::Key::ControlRight => true,
        rdev::Key::Alt => true,
        rdev::Key::MetaLeft => true,
        rdev::Key::MetaRight => true,
        rdev::Key::Tab => true,
        _ => false,
    }
}

pub enum StateMachineState {
    Normal,
    Mouse,
    Special,
}

pub struct StateMachine {
    pub state: StateMachineState,
    pub trigger: Option<rdev::Key>,
    pub buffer: Vec<Event>,
    pub buffer_start_time: SystemTime,
}

impl StateMachine {
    pub fn new() -> StateMachine {
        StateMachine {
            state: StateMachineState::Normal,
            trigger: None,
            buffer: Vec::new(),
            buffer_start_time: SystemTime::now(),
        }
    }

    fn flush_buffer(&mut self) -> Option<StateMachineResult> {
        if self.buffer.is_empty() {
            return None;
        }

        // returns the buffer, start_time, and end_time, then resets the buffer
        let buffer = self.buffer.clone();
        let buffer_start_time = self.buffer_start_time;
        self.buffer = Vec::new();
        self.buffer_start_time = SystemTime::now();
        return Some(StateMachineResult {
            events: buffer,
            start_time: buffer_start_time,
            end_time: SystemTime::now(),
        });
    }

    fn handle_normal(
        &mut self,
        event: InputEvent,
        display_rect: Rect,
    ) -> Option<StateMachineResult> {
        match event.event {
            rdev::EventType::KeyPress(key) => {
                if is_special(&key) && self.trigger.is_none() {
                    self.trigger = Some(key);
                    let res = self.flush_buffer();
                    self.buffer
                        .push(Event::KeyboardEvent(KeyboardEvent { key }));
                    self.state = StateMachineState::Special;
                    return res;
                } else {
                    self.buffer
                        .push(Event::KeyboardEvent(KeyboardEvent { key }));
                    return None;
                }
            }
            rdev::EventType::ButtonPress(button) => {
                let res = self.flush_buffer();
                self.buffer.push(Event::MouseEvent(MouseEvent {
                    button,
                    mouse_position: event.mouse_position,
                    display_rect,
                }));
                self.state = StateMachineState::Mouse;
                return res;
            }
            _ => {
                return None;
            }
        }
    }

    fn handle_mouse(
        &mut self,
        event: InputEvent,
        display_rect: Rect,
    ) -> Option<StateMachineResult> {
        match event.event {
            rdev::EventType::ButtonRelease(_) => {
                //self.buffer.push(event);
                let res = self.flush_buffer();
                self.state = StateMachineState::Normal;
                return res;
            }
            rdev::EventType::ButtonPress(button) => {
                self.buffer.push(Event::MouseEvent(MouseEvent {
                    button,
                    mouse_position: event.mouse_position,
                    display_rect,
                }));
                return None;
            }
            rdev::EventType::KeyPress(key) => {
                self.buffer
                    .push(Event::KeyboardEvent(KeyboardEvent { key }));
                return None;
            }
            _ => {
                return None;
            }
        }
    }

    fn handle_special(
        &mut self,
        event: InputEvent,
        display_rect: Rect,
    ) -> Option<StateMachineResult> {
        match event.event {
            rdev::EventType::KeyPress(key) => {
                self.buffer
                    .push(Event::KeyboardEvent(KeyboardEvent { key }));
                return None;
            }
            rdev::EventType::ButtonPress(button) => {
                self.buffer.push(Event::MouseEvent(MouseEvent {
                    button,
                    mouse_position: event.mouse_position,
                    display_rect,
                }));
                return None;
            }
            rdev::EventType::KeyRelease(key) => {
                if Some(key) == self.trigger {
                    self.trigger = None;
                    let res = self.flush_buffer();
                    self.state = StateMachineState::Normal;
                    return res;
                } else {
                    return None;
                }
            }
            _ => {
                return None;
            }
        }
    }

    pub fn update(&mut self, event: InputEvent, display_rect: Rect) -> Option<StateMachineResult> {
        match self.state {
            StateMachineState::Normal => {
                return self.handle_normal(event, display_rect);
            }
            StateMachineState::Mouse => {
                return self.handle_mouse(event, display_rect);
            }
            StateMachineState::Special => {
                return self.handle_special(event, display_rect);
            }
        }
    }
}
