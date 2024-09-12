use crate::input::state_machine;

pub fn serialize_result(
    result: &state_machine::StateMachineResult,
    base64_image: &String,
) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
    let mut events = Vec::new();
    for event in &result.events {
        match event {
            &state_machine::Event::MouseEvent(mouse_event) => {
                let formatted_display = format!(
                    r#"{{"left":{},"top":{},"right":{},"bottom":{}}}"#,
                    &mouse_event.display_rect.origin.x,
                    &mouse_event.display_rect.origin.y,
                    &mouse_event.display_rect.origin.x + &mouse_event.display_rect.size.width,
                    &mouse_event.display_rect.origin.y + &mouse_event.display_rect.size.height
                );
                events.push(format!(
                    r#"{{"x":{},"y":{},"button":{},"pressed":{},"display":{}}}"#,
                    mouse_event.mouse_position.x,
                    mouse_event.mouse_position.y,
                    serde_json::to_string(&mouse_event.button)?,
                    true,
                    formatted_display
                ));
            }
            &state_machine::Event::KeyboardEvent(keyboard_event) => {
                events.push(format!(
                    r#"{}"#,
                    serde_json::to_string(&keyboard_event.key)?
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
