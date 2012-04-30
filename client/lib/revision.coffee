# **revision.coffee**
# This module generates a past revision of a data file and caches it in 'data/rev'.
#
# The saved file has the name of the id of the point in the journal's history
# that the revision represents.

create = (revIndex, data) ->
  journal = data.journal
  revTitle = data.title
  revStory = []
  revJournal = []
  for journalEntry in journal.slice 0, (+revIndex)+1
    itemSplicedIn = false
    itemEdited = false
    revJournal.push(journalEntry)
    switch journalEntry.type
      when 'create'
        if journalEntry.item.title?
          revTitle = journalEntry.item.title
      when 'add'
        if journalEntry.after?
          for storyItem, i in revStory
            if storyItem.id == journalEntry.after
              itemSplicedIn = true
              revStory.splice(i+1,0,journalEntry.item)
              break
          if !itemSplicedIn #defensive coding for if we don't have a story item to put this after
            revStory.push journalEntry.item
        else
          revStory.push journalEntry.item
      when 'edit'
        for storyItem, i in revStory
          if storyItem.id == journalEntry.id
            revStory[i] = journalEntry.item
            itemEdited = true
            break
        if !itemEdited  #the first journal entry for welcome visitors is an edit
          revStory.push(journalEntry.item)
      when 'move'
        items = []
        for storyItem in revStory
          items[storyItem.id] = storyItem
        revStory = []
        for itemId in journalEntry.order
          revStory.push(items[itemId])
      when 'remove'
        removeId = journalEntry.id;
        for storyItem, i in revStory
          if storyItem.id == removeId
            revStory.splice(i,1)
            break
      #when 'fork'   # do nothing when fork
  return {story: revStory, journal: revJournal, title: revTitle}


exports.create = create