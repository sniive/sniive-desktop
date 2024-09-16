use crate::input::state_machine;

pub fn serialize_result(
    result: &state_machine::StateMachineResult,
    base64_image: &String,
) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
    let mut events = Vec::new();
    for event in &result.events {
        match event {
            &state_machine::Event::MouseEvent(mouse_event) => {
                let button = match &mouse_event.button {
                    &rdev::Button::Left => "left",
                    &rdev::Button::Right => "right",
                    &rdev::Button::Middle => "middle",
                    _ => "unknown",
                };

                let formatted_display = format!(
                    r#"{{"left":{},"top":{},"right":{},"bottom":{}}}"#,
                    &mouse_event.display_rect.origin.x,
                    &mouse_event.display_rect.origin.y,
                    &mouse_event.display_rect.origin.x + &mouse_event.display_rect.size.width,
                    &mouse_event.display_rect.origin.y + &mouse_event.display_rect.size.height
                );
                events.push(format!(
                    r#"{{"x":{},"y":{},"button":"{}","pressed":{},"display":{}}}"#,
                    mouse_event.mouse_position.x,
                    mouse_event.mouse_position.y,
                    button,
                    true,
                    formatted_display
                ));
            }
            &state_machine::Event::KeyboardEvent(keyboard_event) => {
                let key = match &keyboard_event.key {
                    &rdev::Key::Alt => "Alt",
                    &rdev::Key::AltGr => "AltGr",
                    &rdev::Key::Backspace => "Backspace",
                    &rdev::Key::CapsLock => "CapsLock",
                    &rdev::Key::ControlLeft => "ControlLeft",
                    &rdev::Key::ControlRight => "ControlRight",
                    &rdev::Key::Delete => "Delete",
                    &rdev::Key::DownArrow => "DownArrow",
                    &rdev::Key::End => "End",
                    &rdev::Key::Escape => "Escape",
                    &rdev::Key::F1 => "F1",
                    &rdev::Key::F10 => "F10",
                    &rdev::Key::F11 => "F11",
                    &rdev::Key::F12 => "F12",
                    &rdev::Key::F13 => "F13",
                    &rdev::Key::F14 => "F14",
                    &rdev::Key::F15 => "F15",
                    &rdev::Key::F16 => "F16",
                    &rdev::Key::F17 => "F17",
                    &rdev::Key::F18 => "F18",
                    &rdev::Key::F19 => "F19",
                    &rdev::Key::F20 => "F20",
                    &rdev::Key::F21 => "F21",
                    &rdev::Key::F22 => "F22",
                    &rdev::Key::F23 => "F23",
                    &rdev::Key::F24 => "F24",
                    &rdev::Key::F2 => "F2",
                    &rdev::Key::F3 => "F3",
                    &rdev::Key::F4 => "F4",
                    &rdev::Key::F5 => "F5",
                    &rdev::Key::F6 => "F6",
                    &rdev::Key::F7 => "F7",
                    &rdev::Key::F8 => "F8",
                    &rdev::Key::F9 => "F9",
                    &rdev::Key::Home => "Home",
                    &rdev::Key::LeftArrow => "LeftArrow",
                    // also known as "windows", "super", and "command"
                    &rdev::Key::MetaLeft => "MetaLeft",
                    // also known as "windows", "super", and "command"
                    &rdev::Key::MetaRight => "MetaRight",
                    &rdev::Key::PageDown => "PageDown",
                    &rdev::Key::PageUp => "PageUp",
                    &rdev::Key::Return => "Return",
                    &rdev::Key::RightArrow => "RightArrow",
                    &rdev::Key::ShiftLeft => "ShiftLeft",
                    &rdev::Key::ShiftRight => "ShiftRight",
                    &rdev::Key::Space => "Space",
                    &rdev::Key::Tab => "Tab",
                    &rdev::Key::UpArrow => "UpArrow",
                    &rdev::Key::PrintScreen => "PrintScreen",
                    &rdev::Key::ScrollLock => "ScrollLock",
                    &rdev::Key::Pause => "Pause",
                    &rdev::Key::NumLock => "NumLock",
                    &rdev::Key::BackQuote => "BackQuote",
                    &rdev::Key::Num1 => "Num1",
                    &rdev::Key::Num2 => "Num2",
                    &rdev::Key::Num3 => "Num3",
                    &rdev::Key::Num4 => "Num4",
                    &rdev::Key::Num5 => "Num5",
                    &rdev::Key::Num6 => "Num6",
                    &rdev::Key::Num7 => "Num7",
                    &rdev::Key::Num8 => "Num8",
                    &rdev::Key::Num9 => "Num9",
                    &rdev::Key::Num0 => "Num0",
                    &rdev::Key::Minus => "Minus",
                    &rdev::Key::Equal => "Equal",
                    &rdev::Key::KeyQ => "KeyQ",
                    &rdev::Key::KeyW => "KeyW",
                    &rdev::Key::KeyE => "KeyE",
                    &rdev::Key::KeyR => "KeyR",
                    &rdev::Key::KeyT => "KeyT",
                    &rdev::Key::KeyY => "KeyY",
                    &rdev::Key::KeyU => "KeyU",
                    &rdev::Key::KeyI => "KeyI",
                    &rdev::Key::KeyO => "KeyO",
                    &rdev::Key::KeyP => "KeyP",
                    &rdev::Key::LeftBracket => "LeftBracket",
                    &rdev::Key::RightBracket => "RightBracket",
                    &rdev::Key::KeyA => "KeyA",
                    &rdev::Key::KeyS => "KeyS",
                    &rdev::Key::KeyD => "KeyD",
                    &rdev::Key::KeyF => "KeyF",
                    &rdev::Key::KeyG => "KeyG",
                    &rdev::Key::KeyH => "KeyH",
                    &rdev::Key::KeyJ => "KeyJ",
                    &rdev::Key::KeyK => "KeyK",
                    &rdev::Key::KeyL => "KeyL",
                    &rdev::Key::SemiColon => "SemiColon",
                    &rdev::Key::Quote => "Quote",
                    &rdev::Key::BackSlash => "BackSlash",
                    &rdev::Key::IntlBackslash => "IntlBackslash",
                    &rdev::Key::IntlRo => "IntlRo",   // Brazilian /? and Japanese _ 'ro'
                    &rdev::Key::IntlYen => "IntlYen",  // Japanese Henkan (Convert) key.
                    &rdev::Key::KanaMode => "KanaMode", // Japanese Hiragana/Katakana key.
                    &rdev::Key::KeyZ => "KeyZ",
                    &rdev::Key::KeyX => "KeyX",
                    &rdev::Key::KeyC => "KeyC",
                    &rdev::Key::KeyV => "KeyV",
                    &rdev::Key::KeyB => "KeyB",
                    &rdev::Key::KeyN => "KeyN",
                    &rdev::Key::KeyM => "KeyM",
                    &rdev::Key::Comma => "Comma",
                    &rdev::Key::Dot => "Dot",
                    &rdev::Key::Slash => "Slash",
                    &rdev::Key::Insert => "Insert",
                    &rdev::Key::KpReturn => "KpReturn",
                    &rdev::Key::KpMinus => "KpMinus",
                    &rdev::Key::KpPlus => "KpPlus",
                    &rdev::Key::KpMultiply => "KpMultiply",
                    &rdev::Key::KpDivide => "KpDivide",
                    &rdev::Key::KpDecimal => "KpDecimal",
                    &rdev::Key::KpEqual => "KpEqual",
                    &rdev::Key::KpComma => "KpComma",
                    &rdev::Key::Kp0 => "Kp0",
                    &rdev::Key::Kp1 => "Kp1",
                    &rdev::Key::Kp2 => "Kp2",
                    &rdev::Key::Kp3 => "Kp3",
                    &rdev::Key::Kp4 => "Kp4",
                    &rdev::Key::Kp5 => "Kp5",
                    &rdev::Key::Kp6 => "Kp6",
                    &rdev::Key::Kp7 => "Kp7",
                    &rdev::Key::Kp8 => "Kp8",
                    &rdev::Key::Kp9 => "Kp9",
                    &rdev::Key::VolumeUp => "VolumeUp",
                    &rdev::Key::VolumeDown => "VolumeDown",
                    &rdev::Key::VolumeMute => "VolumeMute",
                    &rdev::Key::Lang1 => "Lang1", // Korean Hangul/English toggle key, and as the Kana key on the Apple Japanese keyboard.
                    &rdev::Key::Lang2 => "Lang2", // Korean Hanja conversion key, and as the Eisu key on the Apple Japanese keyboard.
                    &rdev::Key::Lang3 => "Lang3", // Japanese Katakana key.
                    &rdev::Key::Lang4 => "Lang4", // Japanese Hiragana key.
                    &rdev::Key::Lang5 => "Lang5", // Japanese Zenkaku/Hankaku (Fullwidth/halfwidth) key.
                    &rdev::Key::Function => "Function",
                    &rdev::Key::Apps => "Apps",
                    &rdev::Key::Cancel => "Cancel",
                    &rdev::Key::Clear => "Clear",
                    &rdev::Key::Kana => "Kana",
                    &rdev::Key::Hangul => "Hangul",
                    &rdev::Key::Junja => "Junja",
                    &rdev::Key::Final => "Final",
                    &rdev::Key::Hanja => "Hanja",
                    &rdev::Key::Hanji => "Hanji",
                    &rdev::Key::Print => "Print",
                    &rdev::Key::Select => "Select",
                    &rdev::Key::Execute => "Execute",
                    &rdev::Key::Help => "Help",
                    &rdev::Key::Sleep => "Sleep",
                    &rdev::Key::Separator => "Separator",
                    _ => "Unknown",
                };
                events.push(format!(
                    r#""{}""#,
                    key
                ));
            }
        }
    }

    let data = format!(
        r#"{{"events":[{}],"startTime":{},"endTime":{}}}"#,
        events.join(","),
        result
            .start_time
            .elapsed()?
            .as_millis(),
        result
            .end_time
            .elapsed()?
            .as_millis()
    );

    // convert data to a json string
    let data_string = serde_json::to_string(&data)?;

    Ok(format!(
        r#"{{"base64Image":"{}","data":{}}}"#,
        base64_image, data_string
    ))
}
