# CALFIT — Phase 1 Progress

Plain HTML, CSS and JavaScript. No frameworks or build tools.

## Files
- `index.html` — Home, Progress overview, and dedicated Weight Progress page
- `style.css` — responsive Calfix-inspired UI styling
- `app.js` — dashboard, weight goals, weight logging, history, SVG trend chart, LocalStorage persistence

## Phase 1 features
- Home dashboard retained with nutrition/activity/wellness carousel.
- Progress tab has a Goal Progress card and 3 Months / 6 Months / 1 Year / All Time selectors.
- Separate Weight Progress view is opened through the card's **View details** button and has a Back to Progress control.
- Set a starting weight and target weight.
- Log, edit and delete dated weight check-ins.
- Weight history graph with 7D / 1M / 3M / 6M / 1Y / All filters, target line, and real recorded points only.
- Current, starting, target and remaining weight summaries.
- Data persists in LocalStorage on the same browser/device.

## Run
Open `index.html` in a browser, or publish the files through GitHub Pages.

## Notes
- The Progress screen starts with an empty state rather than invented historical data.
- The `3 Months / 6 Months / 1 Year / All Time` filters on the overview update the selected filter state; the detailed chart has its own date-range filters.
- LocalStorage does not sync data across devices.
- Meal Plan and additional Progress modules are reserved for later phases.
