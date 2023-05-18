public without sharing class OpportunityController {
    public static void removeDeletedAccountsFromWonOpportunities(List<String> deletedAccountsIds) {
        List<Opportunity> opportunitiesRelatedToDeletedAccounts = [SELECT Id FROM Opportunity WHERE AccountId IN :deletedAccountsIds AND StageName = 'Closed Won'];

        if(Schema.sObjectType.Opportunity.isUpdateable()) {
            for(Opportunity relatedOpportunity : opportunitiesRelatedToDeletedAccounts) {
                relatedOpportunity.AccountId = null;
            }

            update opportunitiesRelatedToDeletedAccounts;
        } else if (opportunitiesRelatedToDeletedAccounts.size() > 0) {
            throw new AuraHandledException('Couldn\'t update the opportunities associated with the deleted accounts');
        }
    }
}