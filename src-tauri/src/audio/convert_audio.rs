use std::path::PathBuf;

use circular_queue::CircularQueue;
use hound::{SampleFormat, WavSpec};
use wavers::{read, write, Samples};

pub fn convert_audio(filepath: &PathBuf, base_spec: &WavSpec) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let samples = match (base_spec.sample_format, base_spec.bits_per_sample) {
        (SampleFormat::Int, 16) => {
            let (samples, _): (Samples<i16>,i32) = read::<i16, _>(filepath.clone())?;
            let converted_samples: Samples<f64> = samples.convert::<f64>();
            Ok::<Samples<f64>, &str>(converted_samples)
        }
        (SampleFormat::Int, 32) => {
            let (samples, _): (Samples<i32>,i32) = read::<i32, _>(filepath.clone())?;
            let converted_samples: Samples<f64> = samples.convert::<f64>();
            Ok::<Samples<f64>, &str>(converted_samples)
        }
        (SampleFormat::Float, 32) => {
            let (samples, _): (Samples<f32>,i32) = read::<f32, _>(filepath.clone())?;
            let converted_samples: Samples<f64> = samples.convert::<f64>();
            Ok::<Samples<f64>, &str>(converted_samples)
        }
        sample_format => {
            return Err(format!("Unsupported sample format '{:?}'", sample_format).into())
        }
    }?;

    // if the audio is stereo, we need to average values 2 by 2 to get mono samples
    let mono_samples = if base_spec.channels > 0 {
        let mut mono_samples: Vec<f64> = Vec::with_capacity(samples.len() / base_spec.channels as usize);
        for i in (0..samples.len()).step_by(base_spec.channels as usize) {
            mono_samples.push(samples.iter().skip(i).take(base_spec.channels as usize).sum::<f64>() / base_spec.channels as f64);
        }
        Samples::from(mono_samples)
    } else {
        samples
    };

    // the length of the queue is the number of samples needed to make 10ms
    let queue_length = (base_spec.sample_rate as f64 / 1000.0 * 10.0) as usize;
    let mut queue: CircularQueue<f64> = CircularQueue::with_capacity(queue_length);
    let mut rms_squared: f64 = 0.0;
    let mut max_rms_squared: f64 = 0.0;

    // fill the queue with 0s
    for _ in 0..queue_length {
        queue.push(0.0);
    }

    for sample in mono_samples.iter() {
        if let Some(removed_sample) = queue.push(*sample) {
            rms_squared += (sample * sample - removed_sample * removed_sample) / queue.len() as f64;

            if rms_squared > max_rms_squared {
                max_rms_squared = rms_squared;
            }
        }
    }

    let normalization_factor = 0.6 / max_rms_squared.sqrt();
    let sampling_factor = base_spec.sample_rate as f64 / 16000.0;

    // normalize_samples_vect has a length of the number of samples in the original audio file
    // divided by the sampling factor
    let mut normalized_samples_vect: Vec<f64> = vec![0.0; (mono_samples.len() as f64 / sampling_factor).ceil() as usize];
    for i in 0..normalized_samples_vect.len() {
        normalized_samples_vect[i] = mono_samples[(i as f64 * sampling_factor) as usize] * normalization_factor;
    }
    let normalized_samples: Samples<i16> = Samples::from(normalized_samples_vect).convert::<i16>();

    write(filepath.clone(), &normalized_samples, 16000, 1)?;
    Ok(())
}