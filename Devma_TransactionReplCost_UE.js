/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @Filename Devma_TransactionReplCost_UE.js
 * @Author Nazish
 * @Description User Event script to calculate and manage the "Transaction Repl Cost" field for Invoices and Credit Memos.
 */
define(['N/record', 'N/log', 'N/search'], function (record, log, search) {

    function beforeLoad(context) {
        if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT || context.type === context.UserEventType.COPY) {
           var newRecord = context.newRecord;
            var formId = newRecord.getValue('customform');
            log.debug('formId',formId)

            // Array of form IDs where the field should be hidden
            var hiddenFormIds = ['118','463'];

            if (hiddenFormIds.indexOf(formId) != '-1') {
                // Get the item sublist
                var itemSublist = context.form.getSublist({
                    id: 'item'
                });

                if (itemSublist) {
                    // Get the line-level field and set it to hidden
                    var field = itemSublist.getField({
                        id: 'custcol_transaction_repl_cost'
                    });

                    if (field) {
                        field.updateDisplayType({
                            displayType: 'hidden'
                        });
                    }
                }
            }
        }
    }

    function beforeSubmit(context) {
        if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.COPY) {
            var newRecord = context.newRecord;
            var transactionType = newRecord.type;
            log.debug('transactionType',transactionType)
            // Process for Invoices and Credit Memos
            if (transactionType === 'invoice' || transactionType === 'creditmemo') {
                var itemCount = newRecord.getLineCount({ sublistId: 'item' });

                for (var i = 0; i < itemCount; i++) {
                    var itemId = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    });

                    // Fetch base price from the item record
                    var basePrice = getBasePrice(itemId);
                    log.debug('basePrice',basePrice)
					
      
                    // Set the calculated value to the line-level field
                    newRecord.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_transaction_repl_cost',
                        line: i,
                        value: basePrice
                    });
                }
                   // If Credit Memo is created from an Invoice, inherit the line values
                if (transactionType === 'creditmemo') {
                    var createdFrom = newRecord.getValue({ fieldId: 'createdfrom' });
                    if (createdFrom != null && createdFrom != '') {
                     var tranType = getTransactionType(createdFrom)
                      tranType = getTranType(tranType)
                      log.debug('tranType',tranType)
                      if(tranType == 'invoice'){
                        var parentInvoice = record.load({
                            type: tranType,
                            id: createdFrom
                        });

                        var parentItemCount = parentInvoice.getLineCount({ sublistId: 'item' });
                        for (var j = 0; j < parentItemCount; j++) {
                            var parentReplCost = parentInvoice.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_transaction_repl_cost',
                                line: j
                            });

                            // Set the inherited value on the credit memo lines
                            if (j < itemCount) {
                                newRecord.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_transaction_repl_cost',
                                    line: j,
                                    value: parentReplCost
                                });
                            }
                        }
                      }
                    }
                }
            }
        }
    }

    /**
     * Function to fetch the base price of an item using a saved search.
     * @param {number} itemId - Internal ID of the item.
     * @returns {number} Base price of the item.
     */
    function getBasePrice(itemId) {
        try {
            var itemSearchObj = search.create({
                type: "item",
                filters: [
                    ["pricing.pricelevel", "anyof", "1"], // Base price level
                    "AND",
                    ["internalid", "anyof", itemId]
                ],
                columns: [
                    search.createColumn({
                        name: "unitprice",
                        join: "pricing",
                        label: "Unit Price"
                    })
                ]
            });

            var searchResult = itemSearchObj.run().getRange({ start: 0, end: 1 });
            if (searchResult.length > 0) {
                return parseFloat(searchResult[0].getValue({
                    name: "unitprice",
                    join: "pricing"
                })) || 0;
            }
        } catch (e) {
            log.error('Error fetching base price for item ID: ' + itemId, e);
        }
        return 0;
    }
  function getTransactionType(transactionId) {
        try {
            var result = search.lookupFields({
                type: search.Type.TRANSACTION,
                id: transactionId,
                columns: ['type']
            });

            return result.type[0].value; // Returns the transaction type (e.g., "SalesOrd", "InvAdjst")
        } catch (error) {
            log.error('Error fetching transaction type', error);
            return null;
        }
    }
  function getTranType(trantype){
	   var transaction = '';
	   if(trantype == 'CustInvc')
	   transaction = 'invoice';
	   if(trantype == 'SalesOrd')
	    transaction = 'salesorder';
	   if(trantype == 'VendBill')
	    transaction = 'vendorbill';
	   if(trantype == 'VendCred')
	    transaction = 'billcredit';
	   if(trantype == 'CustCred')
	    transaction = 'creditmemo';
	   if(trantype == 'CashSale')
	    transaction = 'cashsale';
	   if(trantype == 'InvAdjst')
	    transaction = 'inventoryadjustment';
	     if(trantype == 'ItemRcpt')
	    transaction = 'itemreceipt';
	    if(trantype == 'Journal')
	    transaction = 'journal';
	    if(trantype == 'Opprtnty')
	    transaction = 'opportunity';
	    if(trantype == 'LiaAdjst')
	    transaction = 'laibilityadjustment';
	    if(trantype == 'ExpRept')
	    transaction = 'expensereport';
	    if(trantype == 'CustPymt')
	    transaction = 'customerpayment';
	    if(trantype == 'Deposit')
	    transaction = 'deposit';
	    if(trantype == 'CardChrg')
	    transaction = 'creditcard';
	    if(trantype == 'ItemShip')
	    transaction = 'itemfulfillment';
	    if(trantype == 'CustDep')
	    transaction = 'customerdeposit';
	    if(trantype == 'PurchOrd')
	    transaction = 'purchaseorder';
	    if(trantype == 'InvTrnfr')
	    transaction = 'inventorytransfer';
	    if(trantype == 'WorkOrd')
	    transaction = 'workorder';
	    if(trantype == 'Build')
	    transaction = 'assemblybuild';
	    if(trantype == 'FxReval')
	    transaction = 'currencyrevaluation';
	    if(trantype == 'VendAuth')
	    transaction = 'vendorreturnauthorization';
	    if(trantype == 'Estimate')
	    transaction = 'estimate';
	    if(trantype == 'Commissn')
	    transaction = 'commission';
	    if(trantype == 'TrnfrOrd')
	    transaction = 'transfer';
	    if(trantype == 'BinWksht')
	    transaction = 'binputawayworkSheet';
	   if(trantype == '')
	   transaction = '';
	   return transaction;
	 }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit
    };
});