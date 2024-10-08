use crabgrab::prelude::{FrameBitmap, VideoFrameBitmap, VideoFrameBitmapError};
use tauri::AppHandle;
use tokio::sync::mpsc::Receiver;

use crate::{
    input::input_controller::ToUploadEvent,
    upload::serialize_result::serialize_result,
    utils,
};

pub async fn upload_controller(
    app_handle: &AppHandle,
    mut async_receiver: Receiver<ToUploadEvent>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    while let Some(to_upload_event) = async_receiver.recv().await {
        let (events, screenshot) = (to_upload_event.events, to_upload_event.screenshot);
        let image_bitmap_bgra8888 = match screenshot.get_bitmap()? {
            FrameBitmap::BgraUnorm8x4(image_bitmap) => image_bitmap,
            _ => {
                return Err(Box::new(VideoFrameBitmapError::Other(
                    "Unexpected bitmap format".to_string(),
                )))
            }
        };

        let image_base64 =
            utils::make_base64_jpeg_from_bitmap(&image_bitmap_bgra8888)?;

        let result_string = serialize_result(&events, &image_base64)?;
        let upload_link = utils::get_upload_link(app_handle, "json").await.map_err(|_| utils::show_error_dialog(app_handle, "Trouble connecting to client"))?;

        let client = reqwest::Client::new();
        let res = client
            .put(&upload_link)
            .header("Content-Type", "application/json")
            .header("x-ms-blob-type", "BlockBlob")
            .body(result_string)
            .send()
            .await
            .map_err(|_| utils::show_error_dialog(app_handle, "Failed to parse response"))?;

        if !res.status().is_success() {
            eprintln!("Failed to upload data: {:?}", res);
        }
    }

    Ok(())
}
