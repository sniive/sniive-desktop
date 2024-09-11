use cpal::traits::{DeviceTrait, HostTrait};

pub fn select_audio_start() -> Result<Vec<cpal::Device>, String> {
    let host = cpal::default_host();
    let devices = host.input_devices().map_err(|x| x.to_string())?;
    let selected_devices = devices
        .filter_map(|device| {
            if let Ok(config) = device.default_input_config() {
                return match config.sample_format() {
                    cpal::SampleFormat::I16 => Some(device),
                    cpal::SampleFormat::I32 => Some(device),
                    cpal::SampleFormat::F32 => Some(device),
                    _ => None,
                };
            }
            None
        })
        .collect::<Vec<cpal::Device>>();

    Ok(selected_devices)
}
