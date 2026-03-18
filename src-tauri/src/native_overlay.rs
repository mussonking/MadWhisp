use gtk::prelude::*;
use gtk_layer_shell::{Edge, KeyboardMode, Layer, LayerShell};
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc, Mutex,
};

const OVERLAY_WIDTH: i32 = 260;
const OVERLAY_HEIGHT: i32 = 52;
const BOTTOM_MARGIN: i32 = 30;

#[derive(Clone, Debug, PartialEq)]
pub enum OverlayMode {
    Hidden,
    Recording,
    Transcribing,
    Processing,
}

pub struct NativeOverlayState {
    pub mode: Mutex<OverlayMode>,
    pub levels: Mutex<Vec<f32>>,
    pub smoothed_levels: Mutex<Vec<f32>>,
    pub fancy: AtomicBool,
    window_ready: AtomicBool,
}

impl NativeOverlayState {
    pub fn new() -> Self {
        Self {
            mode: Mutex::new(OverlayMode::Hidden),
            levels: Mutex::new(vec![0.0; 16]),
            smoothed_levels: Mutex::new(vec![0.0; 16]),
            fancy: AtomicBool::new(false),
            window_ready: AtomicBool::new(false),
        }
    }

    pub fn set_mode(&self, mode: OverlayMode) {
        *self.mode.lock().unwrap() = mode;
    }

    pub fn update_levels(&self, new_levels: &[f32]) {
        let mut levels = self.levels.lock().unwrap();
        levels.clear();
        levels.extend_from_slice(new_levels);
    }
}

pub fn spawn_overlay(state: Arc<NativeOverlayState>) {
    // GTK is already initialized by Tauri on the main thread.
    // Use glib::idle_add to create the overlay window on the GTK main loop.
    gtk::glib::idle_add_once(move || {
        let window = gtk::Window::new(gtk::WindowType::Toplevel);
        window.set_title("MadWhisp Overlay");
        window.set_default_size(OVERLAY_WIDTH, OVERLAY_HEIGHT);
        window.set_app_paintable(true);
        window.set_decorated(false);

        // Enable RGBA visual for transparency
        if let Some(screen) = <gtk::Window as WidgetExt>::screen(&window) {
            if let Some(visual) = screen.rgba_visual() {
                window.set_visual(Some(&visual));
            }
        }

        // Layer shell setup
        window.init_layer_shell();
        window.set_layer(Layer::Overlay);
        window.set_keyboard_mode(KeyboardMode::None);
        window.set_exclusive_zone(0);
        window.set_anchor(Edge::Bottom, true);
        window.set_layer_shell_margin(Edge::Bottom, BOTTOM_MARGIN);
        window.set_namespace("madwhisp-overlay");

        // Drawing area
        let drawing_area = gtk::DrawingArea::new();
        drawing_area.set_size_request(OVERLAY_WIDTH, OVERLAY_HEIGHT);
        window.add(&drawing_area);

        // Draw callback
        let state_draw = state.clone();
        drawing_area.connect_draw(move |widget, cr| {
            let mode = state_draw.mode.lock().unwrap().clone();

            if mode == OverlayMode::Hidden {
                cr.set_operator(gtk::cairo::Operator::Clear);
                let _ = cr.paint();
                return gtk::glib::Propagation::Stop;
            }

            let alloc = widget.allocation();
            let w = alloc.width() as f64;
            let h = alloc.height() as f64;
            let r = 10.0;

            // Clear background
            cr.set_operator(gtk::cairo::Operator::Clear);
            let _ = cr.paint();
            cr.set_operator(gtk::cairo::Operator::Over);

            // Rounded rectangle path
            cr.new_path();
            cr.arc(w - r, r, r, -std::f64::consts::FRAC_PI_2, 0.0);
            cr.arc(w - r, h - r, r, 0.0, std::f64::consts::FRAC_PI_2);
            cr.arc(r, h - r, r, std::f64::consts::FRAC_PI_2, std::f64::consts::PI);
            cr.arc(r, r, r, std::f64::consts::PI, 3.0 * std::f64::consts::FRAC_PI_2);
            cr.close_path();

            // Dark background fill
            cr.set_source_rgba(0.051, 0.067, 0.09, 0.94);
            let _ = cr.fill_preserve();

            // Border
            cr.set_source_rgba(0.102, 0.165, 0.227, 1.0);
            cr.set_line_width(1.0);
            let _ = cr.stroke();

            let fancy = state_draw.fancy.load(Ordering::Relaxed);
            match mode {
                OverlayMode::Recording => draw_recording(cr, &state_draw, w, h),
                OverlayMode::Transcribing => draw_status(cr, "Transcribing", 0.0, 0.824, 1.0, w, h, fancy),
                OverlayMode::Processing => draw_status(cr, "Processing", 1.0, 0.851, 0.239, w, h, fancy),
                OverlayMode::Hidden => {}
            }

            gtk::glib::Propagation::Stop
        });

        // Smooth levels + repaint timer (30fps)
        let state_timer = state.clone();
        let da = drawing_area.clone();
        gtk::glib::timeout_add_local(std::time::Duration::from_millis(33), move || {
            {
                let raw = state_timer.levels.lock().unwrap();
                let mut smoothed = state_timer.smoothed_levels.lock().unwrap();
                while smoothed.len() < raw.len() {
                    smoothed.push(0.0);
                }
                for (i, s) in smoothed.iter_mut().enumerate() {
                    let target = raw.get(i).copied().unwrap_or(0.0);
                    *s = *s * 0.7 + target * 0.3;
                }
            }
            da.queue_draw();
            gtk::glib::ControlFlow::Continue
        });

        // Visibility timer (check mode every 50ms)
        let state_vis = state.clone();
        let win = window.clone();
        gtk::glib::timeout_add_local(std::time::Duration::from_millis(50), move || {
            let mode = state_vis.mode.lock().unwrap().clone();
            if mode == OverlayMode::Hidden {
                win.hide();
            } else {
                win.show_all();
            }
            gtk::glib::ControlFlow::Continue
        });

        state.window_ready.store(true, Ordering::Relaxed);
        log::info!("Native GTK overlay ready (layer-shell)");
    });
}

fn draw_recording(cr: &gtk::cairo::Context, state: &NativeOverlayState, w: f64, h: f64) {
    let cy = h / 2.0;
    let cx = w / 2.0;

    // Red dot (left of center group)
    let group_width: f64 = 140.0;
    let group_start = cx - group_width / 2.0;

    cr.set_source_rgb(1.0, 0.267, 0.267);
    cr.arc(group_start + 8.0, cy, 6.0, 0.0, 2.0 * std::f64::consts::PI);
    let _ = cr.fill();

    // Waveform bars
    let bar_count = 9usize;
    let bar_width: f64 = 5.0;
    let gap: f64 = 4.0;
    let bars_start_x = group_start + 24.0;

    let smoothed = state.smoothed_levels.lock().unwrap();
    for i in 0..bar_count {
        let level = smoothed.get(i).copied().unwrap_or(0.0) as f64;
        let bar_h = (5.0 + level.powf(0.7) * 28.0).min(36.0);
        let x = bars_start_x + i as f64 * (bar_width + gap);
        let y = cy - bar_h / 2.0;

        let alpha = (0.3 + level * 1.4).min(1.0);
        cr.set_source_rgba(0.0, 1.0, 0.533, alpha);

        let br: f64 = 2.5;
        cr.new_path();
        cr.arc(x + bar_width - br, y + br, br, -std::f64::consts::FRAC_PI_2, 0.0);
        cr.arc(x + bar_width - br, y + bar_h - br, br, 0.0, std::f64::consts::FRAC_PI_2);
        cr.arc(x + br, y + bar_h - br, br, std::f64::consts::FRAC_PI_2, std::f64::consts::PI);
        cr.arc(x + br, y + br, br, std::f64::consts::PI, 3.0 * std::f64::consts::FRAC_PI_2);
        cr.close_path();
        let _ = cr.fill();
    }

    // "REC" text
    cr.set_source_rgb(1.0, 0.267, 0.267);
    cr.select_font_face("monospace", gtk::cairo::FontSlant::Normal, gtk::cairo::FontWeight::Bold);
    cr.set_font_size(14.0);
    let rec_x = bars_start_x + bar_count as f64 * (bar_width + gap) + 8.0;
    cr.move_to(rec_x, cy + 5.0);
    let _ = cr.show_text("REC");
}

fn draw_status(cr: &gtk::cairo::Context, text: &str, r: f64, g: f64, b: f64, w: f64, h: f64, fancy: bool) {
    let cy = h / 2.0;
    let now_ms = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    let t = (now_ms % 10000) as f64 / 1000.0;

    cr.select_font_face("monospace", gtk::cairo::FontSlant::Normal, gtk::cairo::FontWeight::Bold);

    if fancy {
        // === Matrix rain columns ===
        cr.set_font_size(10.0);
        let col_count = 18;
        let matrix_chars = b"01{}[]<>|/\\:;~#$%&@!?*+=^";
        for col in 0..col_count {
            let seed = (col as u128 * 7919 + 31) % 997;
            let speed = 1.5 + (seed % 5) as f64 * 0.6;
            let x = 8.0 + col as f64 * ((w - 16.0) / col_count as f64);

            for row in 0..4 {
                let phase = seed.wrapping_mul((row + 1) as u128) % 1000;
                let fall = ((now_ms + phase * 7) as f64 * speed / 1000.0) % 4.0;
                let y = -10.0 + fall * (h + 20.0) / 3.0 + row as f64 * 16.0;

                if y < 2.0 || y > h - 2.0 { continue; }

                let char_idx = ((now_ms / (80 + seed as u128)) + phase) as usize % matrix_chars.len();
                let ch = matrix_chars[char_idx] as char;

                // Head char bright, trail chars fade
                let age = fall.fract();
                let alpha = if age < 0.3 { 0.7 } else { 0.12 + 0.15 * (1.0 - age) };
                cr.set_source_rgba(r * 0.6 + 0.4 * 0.0, g * 0.6 + 0.4 * 1.0, b * 0.6 + 0.4 * 0.3, alpha);
                cr.move_to(x, y);
                let _ = cr.show_text(&ch.to_string());
            }
        }

        // === Scanlines ===
        let scanline_offset = (now_ms / 40) as f64 % 6.0;
        cr.set_source_rgba(0.0, 1.0, 0.3, 0.04);
        let mut sy = scanline_offset;
        while sy < h {
            cr.rectangle(0.0, sy, w, 1.0);
            let _ = cr.fill();
            sy += 6.0;
        }

        // === Glitch bar (occasional horizontal slice) ===
        let glitch_cycle = (now_ms / 120) % 47;
        if glitch_cycle < 3 {
            let gy = ((now_ms / 60) % (h as u128).max(1)) as f64;
            let gh = 2.0 + (glitch_cycle as f64) * 1.5;
            cr.set_source_rgba(r, g, b, 0.15);
            cr.rectangle(0.0, gy, w, gh);
            let _ = cr.fill();
        }

        // === Terminal border (static, no pulse) ===
        let corner_r = 10.0;
        let inset = 1.5;
        cr.new_path();
        cr.arc(w - corner_r - inset, corner_r + inset, corner_r, -std::f64::consts::FRAC_PI_2, 0.0);
        cr.arc(w - corner_r - inset, h - corner_r - inset, corner_r, 0.0, std::f64::consts::FRAC_PI_2);
        cr.arc(corner_r + inset, h - corner_r - inset, corner_r, std::f64::consts::FRAC_PI_2, std::f64::consts::PI);
        cr.arc(corner_r + inset, corner_r + inset, corner_r, std::f64::consts::PI, 3.0 * std::f64::consts::FRAC_PI_2);
        cr.close_path();
        cr.set_source_rgba(0.0, 1.0, 0.4, 0.12);
        cr.set_line_width(1.0);
        let _ = cr.stroke();
    }

    // === Spinning arc (terminal green tint) ===
    let spin_cx = 24.0;
    let spin_r = 8.0;
    let spin_angle = t * 4.0;
    let (sr, sg, sb) = if fancy { (0.0, 1.0, 0.4) } else { (r, g, b) };
    cr.set_line_width(2.5);
    cr.set_source_rgba(sr, sg, sb, 0.8);
    cr.arc(spin_cx, cy, spin_r, spin_angle, spin_angle + std::f64::consts::PI * 1.2);
    let _ = cr.stroke();
    cr.set_source_rgba(sr, sg, sb, 0.15);
    cr.arc(spin_cx, cy, spin_r, 0.0, std::f64::consts::TAU);
    let _ = cr.stroke();

    // === Main text ===
    cr.set_font_size(15.0);
    let dot_count = ((now_ms / 350) % 4) as usize;
    let dots: String = ".".repeat(dot_count);

    let label = if fancy {
        // Terminal prompt style: > TRANSCRIBING...
        format!("> {}{}", text.to_uppercase(), dots)
    } else {
        format!("{}{}", text, dots)
    };

    let (tr, tg, tb) = if fancy { (0.0, 1.0, 0.4) } else { (r, g, b) };
    cr.set_source_rgb(tr, tg, tb);

    let extents = cr.text_extents(&label).unwrap();
    let tx = (w - extents.width()) / 2.0 + 8.0;
    cr.move_to(tx, cy + 5.0);
    let _ = cr.show_text(&label);

    // === Blinking cursor after text (fancy only) ===
    if fancy && (now_ms / 500) % 2 == 0 {
        cr.set_source_rgba(0.0, 1.0, 0.4, 0.9);
        cr.rectangle(tx + extents.width() + 3.0, cy - 7.0, 8.0, 16.0);
        let _ = cr.fill();
    }
}
