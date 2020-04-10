extern crate fixedbitset;
extern crate js_sys;
extern crate web_sys;
use fixedbitset::FixedBitSet;

mod utils;

use std::fmt;
use wasm_bindgen::prelude::*;

macro_rules! log {
    ( $( $t:tt )* ) => {
      web_sys::console::log_1(&format!( $( $t )* ).into());
    };
}

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub struct Universe {
    width: u32,
    height: u32,
    cells: FixedBitSet,
}

impl Universe {
    fn get_index(&self, row: u32, column: u32) -> usize {
        (row * self.width + column) as usize
    }

    fn live_neighbor_count(&self, row: u32, column: u32) -> u8 {
        let mut count = 0;

        let north = if row == 0 {
            self.height - 1
        } else {
            row - 1
        };

        let south = if row == self.height - 1 {
            0
        } else {
            row + 1
        };

        let west = if column == 0 {
            self.width - 1
        } else {
            column - 1
        };

        let east = if column == self.width - 1 {
            0
        } else {
            column + 1
        };

        let nw = self.get_index(north, west);
        count += self.cells.contains(nw) as u8;
        let n = self.get_index(north, column);
        count += self.cells.contains(n) as u8;
        let ne = self.get_index(north, east);
        count += self.cells.contains(ne) as u8;
        let w = self.get_index(row, west);
        count += self.cells.contains(w) as u8;
        let e = self.get_index(row, east);
        count += self.cells.contains(e) as u8;
        let sw = self.get_index(south, west);
        count += self.cells.contains(sw) as u8;
        let s = self.get_index(south, column);
        count += self.cells.contains(s) as u8;
        let se = self.get_index(south, east);
        count += self.cells.contains(se) as u8;

        count
    }
}

#[wasm_bindgen]
impl Universe {
    pub fn tick(&mut self) {
        // let _timer = utils::Timer::new("Universe::tick");
        let mut next = self.cells.clone();

        for row in 0..self.height {
            for col in 0..self.width {
                let idx = self.get_index(row, col);
                let cell = self.cells[idx];
                let live_neighbors = self.live_neighbor_count(row, col);

                next.set(
                    idx,
                    match (cell, live_neighbors) {
                        (true, x) if x < 2 => false,
                        (true, 2) | (true, 3) => true,
                        (true, x) if x > 3 => false,
                        (false, 3) => true,
                        (otherwise, _) => otherwise,
                    },
                );
            }
        }

        self.cells = next;
    }

    pub fn new() -> Universe {
        utils::set_panic_hook();

        let width = 256;
        let height = 256;

        // log!("width = {}, height = {}", width, height);

        let size = (width * height) as usize;
        let mut cells = FixedBitSet::with_capacity(size);

        for i in 0..size {
            cells.set(i, js_sys::Math::random() > 0.5);
        }

        Universe {
            width,
            height,
            cells,
        }
    }

    pub fn render(&self) -> String {
        self.to_string()
    }

    pub fn width(&self) -> u32 {
        self.width
    }

    pub fn height(&self) -> u32 {
        self.height
    }

    pub fn set_width(&mut self, width: u32) {
        self.width = width;
        let size = (self.width * self.height) as usize;
        self.cells = FixedBitSet::with_capacity(size);
    }

    pub fn set_height(&mut self, height: u32) {
        self.height = height;
        let size = (self.width * self.height) as usize;
        self.cells = FixedBitSet::with_capacity(size);
    }

    pub fn cells(&self) -> *const u32 {
        self.cells.as_slice().as_ptr()
    }

    pub fn clear(&mut self) {
        self.cells.clear();
    }

    pub fn random_seed(&mut self) {
        for i in 0..(self.width * self.height) as usize {
            self.cells.set(i, js_sys::Math::random() > 0.5);
        }
    }

    pub fn toggle_cell(&mut self, row: u32, column: u32) {
        let idx = self.get_index(row, column);
        self.cells.set(idx, !self.cells.contains(idx));
    }

    pub fn turn_cell_off(&mut self, row: u32, column: u32) {
        let idx = self.get_index(row, column);
        self.cells.set(idx, false);
    }

    pub fn turn_cell_on(&mut self, row: u32, column: u32) {
        let idx = self.get_index(row, column);
        self.cells.set(idx, true);
    }
}

impl Universe {
    pub fn get_cells(&self) -> &FixedBitSet {
        &self.cells
    }

    pub fn set_cells(&mut self, cells: &[(u32, u32)]) {
        for (row, col) in cells.iter().cloned() {
            let idx = self.get_index(row, col);
            self.cells.set(idx, true);
        }
    }
}

impl fmt::Display for Universe {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        for i in 0..self.cells.len() {
            if i != 0 && i as u32 % self.width == 0 {
                write!(f, "\n")?;
            }
            let symbol = if self.cells.contains(i) { '◻' } else { '◼' };
            write!(f, "{}", symbol)?;
        }
        Ok(())
    }
}
