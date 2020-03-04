/*+**********************************************************************************
 * The contents of this file are subject to the vtiger CRM Public License Version 1.0
 * ("License"); You may not use this file except in compliance with the License
 * The Original Code is:  vtiger CRM Open Source
 * The Initial Developer of the Original Code is vtiger.
 * Portions created by vtiger are Copyright (C) vtiger.
 * All Rights Reserved.
 ************************************************************************************/

var ModTrackerCommon = {
	showdiff: function (record, atpoint, highlight) {
		if (typeof (atpoint) == 'undefined') {
			atpoint = 0;
		}
		if (typeof (highlight) == 'undefined') {
			highlight = true;
		}

		document.getElementById('status').style.display = 'inline';
		jQuery.ajax({
			method: 'POST',
			url: 'index.php?module=ModTracker&action=ModTrackerAjax&file=ShowDiff&id=' + encodeURIComponent(record) + '&atpoint=' + encodeURIComponent(atpoint) + '&highlight=' + encodeURIComponent(highlight),
		}).done(function (response) {
			document.getElementById('status').style.display = 'none';
			document.getElementById(ModTrackerCommon.OVERLAYID).style.display = 'inline';
			document.getElementById(ModTrackerCommon.OVERLAYID).innerHTML = response;
			document.getElementById(ModTrackerCommon.OVERLAYID).style.display = 'block';
			placeAtCenter(document.getElementById(ModTrackerCommon.OVERLAYID));
		});
	},

	showhistory: function (record, atpoint, highlight) {
		if (typeof (atpoint) == 'undefined') {
			atpoint = 0;
		}
		if (typeof (highlight) == 'undefined') {
			highlight = false;
		}
		var direction = atpoint > ModTrackerCommon.atpoint ? 'back' : 'forwards';
		ModTrackerCommon.atpoint = atpoint;
		jQuery.ajax({
			method: 'POST',
			url: 'index.php?module=ModTracker&action=ModTrackerAjax&file=ShowDiff&mode=history&id=' + encodeURIComponent(record) + '&atpoint=' + encodeURIComponent(atpoint) + '&highlight=' + encodeURIComponent(highlight),
		}).done(function (response) {
			if (response != 'NOTRACKRECORD') {
				const tracker = JSON.parse(response),
					trackData = tracker.trackrecord.latest.details;
				console.log(tracker);
				if (!ModTrackerCommon.active) {
					// First open of the modtracker
					const modalTitle = 'History for ' + tracker.trackrecord.displayname,
						modalContent = `<div id="history-tui-grid">
											<div class="slds-grid slds-m-bottom_x-small">
												<button class="slds-button slds-button_icon slds-button_icon-brand" title="Previous"
													onClick="ModTrackerCommon.showhistory(${record}, (ModTrackerCommon.atpoint + 1));">
													<svg class="slds-button__icon" aria-hidden="true">
														<use xlink:href="include/LD/assets/icons/utility-sprite/svg/symbols.svg#chevronleft"></use>
													</svg>
													<span class="slds-assistive-text">Previous</span>
												</button>
												<div class="slds-col slds-align_absolute-center" id="history-whodidwhatwhen">
													${tracker.trackrecord.latest.modifiedon} by ${tracker.trackrecord.latest.modifiedbylabel}
												</div>
												<button class="slds-button slds-button_icon slds-button_icon-brand" title="Next"
													onClick="ModTrackerCommon.showhistory(${record}, (ModTrackerCommon.atpoint - 1));">
													<svg class="slds-button__icon" aria-hidden="true">
														<use xlink:href="include/LD/assets/icons/utility-sprite/svg/symbols.svg#chevronright"></use>
													</svg>
													<span class="slds-assistive-text">Next</span>
												</button>
											</div>
										</div>`;
					ldsModal.show(modalTitle, modalContent, 'medium', false);
					document.getElementById('global-modal-container').addEventListener('closemodal', ModTrackerCommon.reset);

					var Grid = tui.Grid;
					ModTrackerCommon.gridInstance = new Grid({
						el: document.getElementById('history-tui-grid'),
						columns: [
							{
								name: 'fieldlabel',
								header: 'Field',
							},
							{
								name: 'oldval',
								header: 'Previous value',
								whiteSpace: 'normal'
							},
							{
								name: 'newval',
								header: 'Value changed to',
								whiteSpace: 'normal'
							}
						],
						rowHeight: 'auto',
						columnOptions: {
							resizable: true
						},
						header: {
							align: 'left',
							valign: 'top'
						}
					});
					ModTrackerCommon.active = true;
				} else {
					// Tracker was already open and got new data
					document.getElementById('history-whodidwhatwhen').innerText = 
						`${tracker.trackrecord.latest.modifiedon} by ${tracker.trackrecord.latest.modifiedbylabel}`;
				}
				ModTrackerCommon.gridInstance.clear();
				ModTrackerCommon.refreshData(trackData);
			} else if (response == 'NOTRACKRECORD' && ModTrackerCommon.active) {
				// Tracker modal is open but no further data is available
				ldsPrompt.show('No further history', 'No further history available for this record');
				if (direction == 'back') {
					ModTrackerCommon.atpoint--;
				} else {
					ModTrackerCommon.atpoint++;
				}
			} else {
				// No history at all for this record
				ldsPrompt.show('No history', 'No history available for this record');
			}
		});
	},
	refreshData : function(trackData) {
		let data = [];
		for (item in trackData) {
			data.push({
				id: item,
				fieldlabel: trackData[item].displayname,
				oldval: trackData[item].labelforpreval,
				newval: trackData[item].labelforpostval
			});
		}
		ModTrackerCommon.gridInstance.resetData(data);
	},
	active: false,
	reset: function() {
		ModTrackerCommon.active = false;
		ModTrackerCommon.atpoint = 0;
	}
};
