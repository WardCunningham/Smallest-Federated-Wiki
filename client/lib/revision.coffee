# **revision.coffee**
# This module generates a past revision of a data file and caches it in 'data/rev'.
#
# The saved file has the name of the id of the point in the journal's history
# that the revision represents.

create = (revIndex, data) ->
  journal = data.journal
  revTitle = data.title
  revStory = []
  revJournal = journal[0..(+revIndex)]
  for journalEntry in revJournal
    revStoryIds = revStory.map (storyItem) -> storyItem.id
    switch journalEntry.type
      when 'create'
        if journalEntry.item.title?
          revTitle = journalEntry.item.title
          revStory = journalEntry.item.story || []
      when 'add'
        if (afterIndex = revStoryIds.indexOf journalEntry.after) != -1
          revStory.splice(afterIndex+1,0,journalEntry.item)
        else
          revStory.push journalEntry.item
      when 'edit'
        if (editIndex = revStoryIds.indexOf journalEntry.id) != -1
          revStory.splice(editIndex,1,journalEntry.item)
        else
          revStory.push journalEntry.item
      when 'move'
        items = {}
        for storyItem in revStory
          items[storyItem.id] = storyItem
        revStory = []
        for itemId in journalEntry.order
          revStory.push(items[itemId]) if items[itemId]?
      when 'remove'
        if (removeIndex = revStoryIds.indexOf journalEntry.id) != -1
          revStory.splice(removeIndex,1)
      #when 'fork'   # do nothing when fork
  return {story: revStory, journal: revJournal, title: revTitle}

exports.create = create