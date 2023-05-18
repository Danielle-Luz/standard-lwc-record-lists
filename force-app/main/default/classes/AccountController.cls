public without sharing class AccountController {
    @AuraEnabled
    public static List<Account> getAccountList(String searchedName){
        String formattedSearchedName = '%' + searchedName + '%';

        try {
            List<Account> accountList = [SELECT Id, BillingAddress, CreatedDate, Name, OwnerId, Phone, Type  FROM Account WHERE Name LIKE :formattedSearchedName];

            return accountList;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static void deleteAccountRecords(List<String> recordsId){
        try {
            if(Schema.sObjectType.Account.isDeletable()) {
                List<Account> recordsToBeDeleted = [SELECT Id FROM Account WHERE Id IN :recordsId];

                OpportunityController.removeDeletedAccountsFromWonOpportunities(recordsId);
                
                delete recordsToBeDeleted;
            }
        } catch (Exception e) {
            System.debug(e.getMessage());

            throw new AuraHandledException(e.getMessage());
        }
    }
}