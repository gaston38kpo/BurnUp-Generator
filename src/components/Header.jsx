/**
 * Header.jsx — App header extracted from App.jsx
 *
 * Contains: logo, title input, undo/redo buttons, date range,
 * sprint count badge, offset badge, and v1 error banner.
 */

import { useState } from 'react';
import { formatDate } from '../domain/formatDate';
import { BurnupLogo, PencilIcon, DeleteAllIcon } from '../assets/icons';
import { ACTION_TYPES } from '../lib/useUndoRedo';

export default function Header({
  state,
  dispatch,
  undo,
  redo,
  canUndo,
  canRedo,
  sprintEdit,
  offsetEdit,
  dateFromEdit,
  dateToEdit,
  v1Error,
  onDismissV1Error,
  onClear,
  disabled,
}) {
  const [confirmClear, setConfirmClear] = useState(false);
  return (
    <header className='app-header'>
      <div className='header-row-primary'>
        <div className='header-identity'>
          <BurnupLogo className='header-icon' />
          <input
            type='text'
            className='title-input'
            value={state.title}
            onChange={(e) => dispatch({ type: ACTION_TYPES.SET_TITLE, payload: e.target.value })}
            placeholder='Burnup'
            aria-label='Chart title'
          />
        </div>
        <div className='undo-redo-group'>
          <button
            className='undo-redo-btn'
            onClick={undo}
            disabled={!canUndo}
            aria-label='Undo'
            title='Undo (Ctrl+Z / Cmd+Z)'
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 8L7 5M4 8L7 11M4 8H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            className='undo-redo-btn'
            onClick={redo}
            disabled={!canRedo}
            aria-label='Redo'
            title='Redo (Ctrl+Y / Cmd+Shift+Z)'
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8L9 5M12 8L9 11M12 8H4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <div className="clear-wrapper">
          <button className="btn-icon btn-icon-danger" onClick={() => !disabled && setConfirmClear(true)} disabled={disabled} title="Clear all data">
            <DeleteAllIcon />
          </button>
          {confirmClear && (
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
              <span>Clear all data?</span>
              <button className="confirm-yes" onClick={() => { onClear(); setConfirmClear(false) }}>Yes</button>
              <button className="confirm-no" onClick={() => setConfirmClear(false)}>No</button>
            </div>
          )}
        </div>
      </div>
      <div className='header-row-meta'>
        <div className='meta-dates-group'>
          {dateFromEdit.editing ? (
            <input
              ref={dateFromEdit.ref}
              type='date'
              className='date-input-inline'
              value={state.dateFrom}
              onChange={(e) =>
                dispatch({ type: ACTION_TYPES.SET_DATE_FROM, payload: e.target.value })
              }
              onBlur={dateFromEdit.close}
              onKeyDown={dateFromEdit.handleKeyDown}
              aria-label='Start date'
              max='2200-12-31'
            />
          ) : (
            <button
              className='date-display'
              onClick={dateFromEdit.open}
              title='Click to edit start date'
            >
              {formatDate(state.dateFrom) || "No start date"}
            </button>
          )}
          <span className='date-arrow'>→</span>
          {dateToEdit.editing ? (
            <input
              ref={dateToEdit.ref}
              type='date'
              className='date-input-inline'
              value={state.dateTo}
              onChange={(e) =>
                dispatch({ type: ACTION_TYPES.SET_DATE_TO, payload: e.target.value })
              }
              onBlur={dateToEdit.close}
              onKeyDown={dateToEdit.handleKeyDown}
              aria-label='End date'
              max='2200-12-31'
            />
          ) : (
            <button
              className='date-display'
              onClick={dateToEdit.open}
              title='Click to edit end date'
            >
              {formatDate(state.dateTo) || "No end date"}
            </button>
          )}
        </div>
      <div className='meta-badges-group'>
        {sprintEdit.editing ? (
          <input
            ref={sprintEdit.ref}
            type='number'
            className='sprint-badge-input'
            value={sprintEdit.draft}
            min={1}
            step={1}
            onChange={(e) =>
              sprintEdit.setDraft(e.target.value)
            }
            onBlur={sprintEdit.commit}
            onKeyDown={sprintEdit.handleKeyDown}
            aria-label='Number of additional sprints'
          />
        ) : (
          <button
            className='sprint-badge'
            onClick={sprintEdit.open}
            title='Click to edit sprint count'
            aria-label={`${state.sprintCount} sprint${state.sprintCount !== 1 ? "s" : ""} — click to edit`}
          >
            {state.sprintCount} sprint
            {state.sprintCount !== 1 ? "s" : ""}
            <PencilIcon className='sprint-badge-icon' />
          </button>
        )}
        {offsetEdit.editing ? (
          <input
            ref={offsetEdit.ref}
            type='number'
            className='offset-badge-input'
            value={offsetEdit.draft}
            min={0}
            step={1}
            onChange={(e) =>
              offsetEdit.setDraft(e.target.value)
            }
            onBlur={offsetEdit.commit}
            onKeyDown={offsetEdit.handleKeyDown}
            aria-label='Sprint offset'
          />
        ) : (
          <button
            className='offset-badge'
            onClick={offsetEdit.open}
            title='Click to edit sprint offset'
            aria-label={`Offset ${state.sprintOffset} — click to edit`}
          >
            +{state.sprintOffset}
            <PencilIcon className='sprint-badge-icon' />
          </button>
          )}
        </div>
        </div>

      {v1Error && (
        <div className='v1-error-banner'>
          <span>
            This link uses an older format. Please start fresh.
          </span>
          <button
            onClick={onDismissV1Error}
            aria-label='Dismiss'
          >
            &times;
          </button>
        </div>
      )}
    </header>
  );
}
