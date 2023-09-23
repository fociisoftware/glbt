        await repair().then(async () => {
         await new Promise(resolve => setTimeout(resolve, 1500))
      });

    async function repair () {
      const workbench = {
        async start (doll) {
          //btools.statusText(btools.translate('workflow-conditioning'));
          let { itemList1, itemList2, repairArena, repairTurma } = storage.workbench
          let current = storage.workbench.selectedItem

          let selectedItemX = JSON.parse(
            localStorage.getItem('workbench_selectedItem')
          )
          if (selectedItemX.status == 'toBag' || selectedItemX.status == 'toPackage' || selectedItemX.status == 'toInv') {
            const getSlots = await this.getSlots()
              switch (selectedItemX.status) {
                case 'toWorkbench':
                  await workbench.moveFromBagToWB(current.iid)
                  break

                case 'toFillGoods':
                  await workbench.fillGoods(current.slot)
                  break

                case 'toPackage':
                  await workbench.moveFromWBtoPackage(selectedItemX.slot)
                  break

                case 'toBag':
                  await workbench.moveFromPackageToBag()
                  break

                case 'toInv':
                  await workbench.fromBagToInv()
                  break
              }
            }

          if (doll == 1) {
            //localStorage.setItem('repairInitiated', 'true');
            if (btools.url.path != `mod=overview&doll=${doll}`) {
              btools.navigateTo(`mod=overview&doll=${doll}`)
            } else {
              await this.getSlots()
              if (workbench.spaces > 0) {
                await this.moveFromInvToBag(
                  storage.workbench.selectedItem,
                  0,
                  doll
                )
              } else {
                const timers = JSON.parse(localStorage.getItem('Timers'));
                btools.setTimeOut('repair', timers['Repair'] || 10);
                addLogEntry('Repair slots are full! Please empty it to repair!')
                return
              }
            }
          } else if (doll == 2) {
           
              //localStorage.setItem('repairInitiated', 'true');
              if (btools.url.path != `mod=overview&doll=${doll}`) {
                btools.navigateTo(`mod=overview&doll=${doll}`)
              } else {
                await this.getSlots()
                if (workbench.spaces > 0) {
                  await this.moveFromInvToBag(
                    storage.workbench.selectedItem,
                    0,
                    doll
                  )
                } else {
                  return
                }
              }
            
              //localStorage.setItem('repairInitiated', 'true');
              if (btools.url.path != `mod=overview&doll=${doll}`) {
                btools.navigateTo(`mod=overview&doll=${doll}`)
              } else {
                await this.getSlots()
                if (workbench.spaces > 0) {
                  await this.moveFromInvToBag(
                    storage.workbench.selectedItem,
                    0,
                    doll
                  )
                } else {
                  return
                }
              }
            
          } 
          
        },

        checkItems (doll) {
          let fator = storage.workbench.factor / 100
          let itemList = []

          for (let item of document.querySelectorAll('#char .ui-draggable')) {
            let container = item.getAttribute('data-container-number')
            let conditioning = btools.item.getItemConditioning(item)
            if (conditioning == null) continue
            let b = conditioning[0] / conditioning[1]

            if (b < fator) {
              itemList.push({
                type: btools.item.getItemType(item),
                quality: btools.item.getItemQuality(item),
                name: btools.item.getItemName(item),
                doll,
                container
              })
            }
          }

        },

        async getSlots (cb = false) {
          return new Promise((resolve, reject) => {
            jQuery
              .post(
                btools.link.fullAjax({}),
                {
                  mod: 'forge',
                  submod: 'getWorkbenchPreview',
                  mode: 'workbench',
                  a: new Date().getTime(),
                  sh: btools.url.query('sh')
                },
                resp => {
                  workbench.slots = JSON.parse(resp).slots
                  workbench.spaces = 0
                  workbench.freeSlots = []

                  for (let _slot of workbench.slots) {
                    if (_slot['forge_slots.state'] == 'closed') {
                      workbench.spaces++
                      workbench.freeSlots.push(_slot)
                    }
                  }

                  resolve() // The Promise resolves here.
                }
              )
              .fail((jqXHR, textStatus, errorThrown) => {
                reject(
                  new Error(`Request failed: ${textStatus}, ${errorThrown}`)
                ) // The Promise is rejected if the request fails.
              })
          })
        },

        moveFromInvToBag (list) {
          return new Promise((resolve, reject) => {
            localStorage.setItem('repairInitiated', 'true')
            
            let item = list.item
            const tooltip = item.getAttribute('data-tooltip')
            const firstItemName = getFirstItemName(tooltip)
            addLogEntry(`Repair Initiated for` + ' ' + firstItemName)
            const tabElement = document.querySelector('a.awesome-tabs[data-bag-number="512"]');
            tabElement.click();
            const inventoryGrid = document.getElementById('inv')
            
            const targetSpot = btools.item._move.FESIIEK(inventoryGrid, item)//btools.item._move.findEmptySpotInInventory(inventoryGrid)
            let toX = 1;  // Fallback value
            let toY = 1;  // Fallback value
            
            try {
              toX = targetSpot.x + 1;
            } catch (e) {
              try {
                toX = 1;
              } catch (e) {
                toX = 2;
              }
            }
            
            try {
              toY = targetSpot.y + 1;
            } catch (e) {
              try {
                toY = 1;
              } catch (e) {
                toY = 2;
              }
            }
            //btools.item.findEmptySpotRepair(2, 3, (spot, bag) => {
              jQuery
                .post(
                  btools.link.fullAjax({
                    mod: 'inventory',
                    submod: 'move',
                    from: item.getAttribute('data-container-number'),
                    fromX: 1,
                    fromY: 1,
                    to: 512,
                    toX: toX,
                    toY: toY,
                    amount: 1,
                    doll: list.doll
                  }),
                  {
                    a: new Date().getTime(),
                    sh: btools.url.query('sh')
                  },
                  resp => {
                    let selectedItemX = JSON.parse(
                      localStorage.getItem('workbench_selectedItem')
                    )
                    try {
                    let selectedItem = {
                      item: item,
                      itemType: btools.item.getItemType(item),
                      itemQ: btools.item.getItemQuality(item),
                      itemName: btools.item.getItemName(item),
                      itemContainer: item.getAttribute('data-container-number'),
                      iid: JSON.parse(resp).to.data.itemId,
                      status: 'toWorkbench',
                      spot: targetSpot,
                      bag: 512,
                      doll: list.doll,
                      slot: selectedItemX.slot,
                      type: selectedItemX.type
                    }

                      localStorage.setItem(
                      'workbench_selectedItem',
                      JSON.stringify(selectedItem)
                    )
                    this.moveFromBagToWB(JSON.parse(resp).to.data.itemId)
                      .then(resolve)
                      .catch(reject)

                  } catch (error) {
                    // Log the error for debugging
                    addLogEntry('No empty space in first bag. Disabling repair.')
                  
                    // Set 'activateRepair' in localStorage to 'false'
                    localStorage.setItem('activateRepair', 'false');
                  
                    // Refresh the page
                    location.reload();
                  }
                  }
                )
                .fail(reject)
            //})
          })
        },

        moveFromBagToWB (id) {
          sortPackagesInDesc();
          addLogEntry('Item moved to workbench')
          return new Promise((resolve, reject) => {
            let slot = 0
            let responseSlot
            for (let _slot of workbench.slots) {
              if (_slot['forge_slots.state'] == 'closed') {
                responseSlot = _slot
                slot = _slot['forge_slots.slot']
                break
              }
            }
              jQuery.post(btools.link.fullAjax({}), {
                mod: 'forge',
                submod: 'getWorkbenchPreview',
                mode: 'workbench',
                slot,
                iid: id,
                amount: 1,
                a: new Date().getTime(),
                sh: btools.url.query('sh')
              })
              if (btools.status().gold > 10000) {
                jQuery
                  .post(
                    btools.link.fullAjax({}),
                    {
                      mod: 'forge',
                      submod: 'rent',
                      mode: 'workbench',
                      slot: slot,
                      rent: 2,
                      item: id,
                      a: new Date().getTime(),
                      sh: btools.url.query('sh')
                    },
                    _ => {
                      let selectedItemX = JSON.parse(
                        localStorage.getItem('workbench_selectedItem')
                      )
                      let selectedItem = {
                        slot,
                        status: 'toFillGoods',
                        item: selectedItemX.item,
                        itemType: selectedItemX.itemType,
                        itemQ: selectedItemX.itemQ,
                        itemName: selectedItemX.itemName,
                        itemContainer: selectedItemX.itemContainer,
                        iid: selectedItemX.iid,
                        spot: selectedItemX.spot,
                        bag: selectedItemX.bag,
                        doll: selectedItemX.doll,
                        type: selectedItemX.type
                      }
                      localStorage.setItem(
                        'workbench_selectedItem',
                        JSON.stringify(selectedItem)
                      )
                      workbench.fillGoods(slot).then(resolve).catch(reject)
                    }
                  )
                  .fail(reject)
                //break
              } else {
              //  slot++
              }
            
          })
        },

        fillGoods(slot, quality = -1, bool = true) {
          return this.getSlots()
              .then(() => {
                  // addLogEntry('Picking Material');
                  return jQuery.post(btools.link.fullAjax({}), {
                      mod: 'forge',
                      submod: 'storageToWarehouse',
                      mode: 'workbench',
                      slot,
                      quality,
                      a: new Date().getTime(),
                      sh: btools.url.query('sh')
                  })
              })
              .then(() => {
                return jQuery.get(btools.link.full({
                    mod: 'forge',
                    submod: 'workbench',
                    sh: btools.url.query('sh')
                }));
            })
              .then(() => {
                  if (quality < Number(localStorage.getItem('repairMaxQuality'))) {
                      return this.fillGoods(slot, ++quality, bool);
                  } else {
                      return jQuery.post(btools.link.fullAjax({}), {
                          mod: 'forge',
                          submod: 'start',
                          mode: 'workbench',
                          slot,
                          a: new Date().getTime(),
                          sh: btools.url.query('sh')
                      });
                  }
              })
              .then(() => {
                  if (bool) {
                      let selectedItemX = JSON.parse(localStorage.getItem('workbench_selectedItem'));
                      let selectedItem = {
                          status: 'toPackage',
                          item: selectedItemX.item,
                          itemType: selectedItemX.itemType,
                          itemQ: selectedItemX.itemQ,
                          itemName: selectedItemX.itemName,
                          itemContainer: selectedItemX.itemContainer,
                          iid: selectedItemX.iid,
                          doll: selectedItemX.doll,
                          slot: selectedItemX.slot,
                          spot: selectedItemX.spot,
                          bag: selectedItemX.bag,
                          type: selectedItemX.type
                      };
                      localStorage.setItem('workbench_selectedItem', JSON.stringify(selectedItem));
                      return this.moveFromWBtoPackage(slot);
                  } else {
                      workbench.queue--;
                      if (workbench.queue == 0) {
                          window.location.reload();
                      }
                      return Promise.resolve();
                  }
              })
              .catch(error => {
                  return Promise.reject(error);
              });
      },      

        moveFromWBtoPackage (slot) {
          return new Promise((resolve, reject) => {
            //addLogEntry('Moving to Package');
            let _time = workbench.slots[slot].formula.duration * 1000 || 10000

            //btools.countdownText(btools.translate('workflow-waiting'), _time);
            jQuery.post(
              btools.link.fullAjax({}),
              {
                mod: 'forge',
                submod: 'getWorkbenchPreview',
                mode: 'workbench',
                a: new Date().getTime(),
                sh: btools.url.query('sh')
              },
              resp => {
                workbench.slots = JSON.parse(resp).slots
                workbench.spaces = 0
                workbench.freeSlots = []

                for (let _slot of workbench.slots) {
                  if (_slot['forge_slots.state'] == 'closed') {
                    workbench.spaces++
                    workbench.freeSlots.push(_slot)
                  }
                }

                // Continue the original logic after getting slots
                setTimeout(() => {
                  jQuery.post(
                    btools.link.fullAjax({}),
                    {
                      mod: 'forge',
                      submod: 'lootbox',
                      mode: 'workbench',
                      slot: slot,
                      a: new Date().getTime(),
                      sh: btools.url.query('sh')
                    },
                    resp => {
                      if (resp === 'document.location.href=document.location.href;') {
                        return window.location.reload();
                    }

                      let selectedItemX = JSON.parse(
                        localStorage.getItem('workbench_selectedItem')
                      )

                      let selectedItem = {
                        status: 'toBag',
                        item: selectedItemX.item,
                        itemType: selectedItemX.itemType,
                        itemQ: selectedItemX.itemQ,
                        itemName: selectedItemX.itemName,
                        itemContainer: selectedItemX.itemContainer,
                        iid: selectedItemX.iid,
                        doll: selectedItemX.doll,
                        slot: selectedItemX.slot,
                        spot: selectedItemX.spot,
                        bag: selectedItemX.bag,
                        type: selectedItemX.type
                      }

                      localStorage.setItem(
                        'workbench_selectedItem',
                        JSON.stringify(selectedItem)
                      )
                      workbench.moveFromPackageToBag()

                      resolve() // Resolve the promise to indicate successful completion
                    }
                  )
                }, _time)
              }
            )
          })
        },

        moveFromPackageToBag (page = 1) {
          return new Promise((resolve, reject) => {
            //addLogEntry('Moving the item to Bag')
            //let { item, bag, spot } = storage.workbench.selectedItem

            //const itemType = btools.item.getItemType(item)
            //const itemQ = btools.item.getItemQuality(item)
            //const itemName = btools.item.getItemName(item)

            let itemType, itemQ, itemName, item, bag, spot;

            if (storage.workbench && storage.workbench.selectedItem) {
                ({ item, bag, spot } = storage.workbench.selectedItem);
                itemType = btools.item.getItemType(item);
                itemQ = btools.item.getItemQuality(item);
                itemName = btools.item.getItemName(item);
            } else {
                let selectedItemX = JSON.parse(localStorage.getItem('workbench_selectedItem'));
                if (selectedItemX) {
                    itemType = selectedItemX.itemType;
                    itemQ = selectedItemX.itemQ;
                    itemName = selectedItemX.itemName;
                    // Assuming you may want to retrieve the other values too:
                    item = selectedItemX.item;
                    bag = selectedItemX.bag;
                    spot = selectedItemX.spot;
                }
                // Optionally handle the scenario where both sources of data are unavailable
                else {
                    console.error('No item data available in either storage.workbench.selectedItem or localStorage.');
                }
            }


            let selectedItemX = JSON.parse(
              localStorage.getItem('workbench_selectedItem')
            )

            let find = false
            //const fx = btools.item.getItemType(item)
            const fd = selectedItemX.itemQ;//btools.item.getItemQuality(item)
            jQuery.get(
              btools.link.full({
                mod: 'packages',
                f: '',
                fq: fd,
                qry: '',
                page: page,
                sh: btools.url.query('sh')
              }),
              resp => {
                let parser = new DOMParser()
                let doc = parser.parseFromString(resp, 'text/html')
                let packages = doc.querySelectorAll('.packageItem')
                let promises = []

                for (let pack of packages) {
                  let i = pack.querySelector('.ui-draggable')
                  let packItem = {
                    type: btools.item.getItemType(i),
                    quality: btools.item.getItemQuality(i),
                    name: btools.item.getItemName(i)
                  }

                  if (
                    itemName == packItem.name &&
                    itemQ == packItem.quality &&
                    itemType == packItem.type
                  ) {
                    find = true
                    let promise = new Promise((resolve, reject) => {
                      jQuery.post(
                        btools.link.fullAjax({
                          mod: 'inventory',
                          submod: 'move',
                          from: pack
                            .querySelector('[data-container-number]')
                            .getAttribute('data-container-number'),
                          fromX: 1,
                          fromY: 1,
                          to: selectedItemX.bag,
                          toX: selectedItemX.spot.x + 1,
                          toY: selectedItemX.spot.y + 1,
                          amount: 1
                        }),
                        {
                          a: new Date().getTime(),
                          sh: btools.url.query('sh')
                        },
                        _ => {
                          let selectedItemX = JSON.parse(
                            localStorage.getItem('workbench_selectedItem')
                          )
                          let selectedItem = {
                            status: 'toInv',
                            item: selectedItemX.item,
                            itemType: selectedItemX.itemType,
                            itemQ: selectedItemX.itemQ,
                            itemName: selectedItemX.itemName,
                            itemContainer: selectedItemX.itemContainer,
                            iid: selectedItemX.iid,
                            doll: selectedItemX.doll,
                            slot: selectedItemX.slot,
                            spot: selectedItemX.spot,
                            bag: selectedItemX.bag,
                            type: selectedItemX.type
                          }
                          localStorage.setItem(
                            'workbench_selectedItem',
                            JSON.stringify(selectedItem)
                          )
                          workbench.fromBagToInv()
                          resolve()
                        }
                      )
                    })
                    promises.push(promise)
                  }
                }

                if (!find) {
                  Promise.all(promises)
                    .then(() => {
                      this.moveFromPackageToBag(++page)
                        .then(resolve)
                        .catch(reject)
                    })
                    .catch(reject)
                } else {
                  resolve()
                }
              }
            )
          })
        },

        fromBagToInv () {
          return new Promise((resolve, reject) => {
            //addLogEntry('Moving to Inventory');
            let itemType, itemQ, itemName, item, bag, spot;

            if (storage.workbench && storage.workbench.selectedItem) {
                ({ item, bag, spot } = storage.workbench.selectedItem);
                itemType = btools.item.getItemType(item);
                itemQ = btools.item.getItemQuality(item);
                itemName = btools.item.getItemName(item);
            } else {
                let selectedItemX = JSON.parse(localStorage.getItem('workbench_selectedItem'));
                if (selectedItemX) {
                    itemType = selectedItemX.itemType;
                    itemQ = selectedItemX.itemQ;
                    itemName = selectedItemX.itemName;
                    // Assuming you may want to retrieve the other values too:
                    item = selectedItemX.item;
                    bag = selectedItemX.bag;
                    spot = selectedItemX.spot;
                }
                // Optionally handle the scenario where both sources of data are unavailable
                else {
                    console.error('No item data available in either storage.workbench.selectedItem or localStorage.');
                }
            }

            let selectedItemX = JSON.parse(
              localStorage.getItem('workbench_selectedItem')
            )

            jQuery
              .post(
                btools.link.fullAjax({
                  mod: 'inventory',
                  submod: 'move',
                  from: selectedItemX.bag,
                  fromX: selectedItemX.spot.x + 1,
                  fromY: selectedItemX.spot.y + 1,
                  to: selectedItemX.itemContainer, //|| item.getAttribute('data-container-number'),
                  toX: 1,
                  toY: 1,
                  amount: 1,
                  doll: selectedItemX.doll
                }),
                {
                  a: new Date().getTime(),
                  sh: btools.url.query('sh')
                },
                resp => {
                  let selectedItemX = JSON.parse(
                    localStorage.getItem('workbench_selectedItem')
                  )
                  ////////////MAYBE CHANGE START FUNCTION TO FALSE TRUE , CONSIDER
                  try{
                    let selectedItem = {
                      selectedItem: false,
                      name: selectedItemX.itemName, //btools.item.getItemName(item),
                      item: selectedItemX.item,
                      itemType: selectedItemX.itemType,
                      itemQ: selectedItemX.itemQ,
                      itemName: selectedItemX.itemName,
                      itemContainer: selectedItemX.itemContainer,
                      iid: selectedItemX.iid,
                      doll: selectedItemX.doll,
                      slot: selectedItemX.slot,
                      spot: selectedItemX.spot,
                      bag: selectedItemX.bag,
                      type: selectedItemX.type,
                      repairPercentage: JSON.parse(resp)
                      .to.data.tooltip.pop()
                      .pop()[0]
                      .match(/\d+/g),
                      repaired: btools.item.getItemContainer(item)
                    }
                    localStorage.setItem(
                      'workbench_selectedItem',
                      JSON.stringify(selectedItem)
                    )


                  /*let conditioning = JSON.parse(resp)
                    .to.data.tooltip.pop()
                    .pop()[0]
                    .match(/\d+/g) || 0;
                    */
                    let conditioningValue = 0;

                    const parsedResp = JSON.parse(resp);

                    // Validate that the structure exists
                    if (parsedResp && parsedResp.to && parsedResp.to.data && parsedResp.to.data.tooltip) {
                      const tooltipData = parsedResp.to.data.tooltip;
                  
                      // Validate that tooltipData is an array and has length
                      if (Array.isArray(tooltipData) && tooltipData.length > 0) {
                        const lastTooltip = tooltipData[tooltipData.length - 1];
                  
                        // Validate that lastTooltip is an array and has length
                        if (Array.isArray(lastTooltip) && lastTooltip.length > 0) {
                  
                          // Iterate over lastTooltip to find the Conditioning value
                          for (const tooltip of lastTooltip) {
                            if (Array.isArray(tooltip) && typeof tooltip[0] === 'string') {
                              const match = tooltip[0].match(/Conditioning (\d+)/);
                  
                              if (match && match[1]) {
                                conditioningValue = parseInt(match[1], 10);
                                break;  // exit the loop once the Conditioning value is found
                              }
                            }
                          }
                        }
                      }
                    }

                    addLogEntry('Item finished repairing.')              

                    localStorage.setItem(
                      'repair_selectedItem',
                      JSON.stringify(selectedItem)
                    )
                  //btools.setTimeOut('repair', 5) 
                  localStorage.setItem('repairInitiated', 'false')
                  window.location.reload()

                  resolve()
                } catch {
                  localStorage.setItem(
                    'workbench_selectedItem', '{}'
                  )
                }
                }
              )
              .fail(reject)
              
          })
          
          
        }
      }

      const baseUrl = currentUrl.origin;
      const searchParams = currentUrl.searchParams;
      const sh = searchParams.get('sh') || '';
      const activeItems = JSON.parse(localStorage.getItem('activeItems'));
      //const previousItem = JSON.parse(localStorage.getItem('workbench_selectedItem')) || {};
      const repairedItem = JSON.parse(localStorage.getItem('repair_selectedItem')) || {};
      // Setting the doll based on user preference
      //const dollselection = localStorage.getItem('repairMercenary');
      //let dolls = (dollselection === 'true') ? 2 : 1;

      const repairALLSelected = localStorage.getItem('repairALL') === 'true';
      const repairMercenarySelected = localStorage.getItem('repairMercenary') === 'true';

      let dolls;
      if (repairALLSelected) {
        dolls = [1, 2];
      } else if (repairMercenarySelected) {
        dolls = [2];
      } else if (!repairMercenarySelected) {
        dolls = [1];
      }

      let foundItemToRepair = false; // This flag checks if we found an item to repair
      let itemWithZeroRepairFound = false; // This flag checks if an item is completely damaged

      const inventoryItems = {
          2: 'helmet',
          11: 'necklace',
          3: 'weapon',
          5: 'armor',
          4: 'shield',
          9: 'gloves',
          10: 'shoes',
          6: 'rings1',
          7: 'rings2'
      };

      async function processDoll(doll)
      {
        //await new Promise(resolve => setTimeout(resolve, 500));
          const response = await fetch(`${baseUrl}/game/index.php?mod=overview&doll=${doll}&sh=${sh}`);
          const html = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const charDiv = doc.getElementById('char');
          const items = charDiv.querySelectorAll('div[data-tooltip]');
          

          for (const item of items) {
              const tooltip = item.getAttribute('data-tooltip');
              const containerNumber = item.getAttribute('data-container-number');
              const itemName = btools.item.getItemName(item);
              const inventoryItem = inventoryItems[containerNumber];
              if (activeItems == null) {
                localStorage.setItem('activateRepair', 'false')
                btools.reload(500);
              }

              if (tooltip && activeItems[inventoryItem]) {
                  const tooltipData = JSON.parse(tooltip);
                  const repairData = tooltipData[tooltipData.length - 1];
                  let repairPercentage;

                  for (let i = repairData.length - 1; i >= Math.max(repairData.length - 3, 0); i--) {
                      if (repairData[i][0].includes('Hint')) {
                          continue;
                      }
                      const match = repairData[i][0].match(/\((\d+)%\)/);
                      if (match) {
                          repairPercentage = parseInt(match[1]);
                          break;
                      }
                  }


                  if (repairedItem.repairPercentage === null) {
                    localStorage.removeItem('repair_selectedItem');
                    window.location.reload();
                    return; // Exit the function early as the item doesn't need to be processed
                  }
                  //const previousItem = JSON.parse(localStorage.getItem('repairedItems'));
                  //const timeDiff = new Date().getTime() - (previousItem.timestamp || 0);
                  //if (timeDiff > 5000 /* 5 seconds */ && previousItem.name === itemName && previousItem.repairPercentage === repairPercentage) {
                  if (repairedItem.name === itemName && Number(repairedItem.repairPercentage[0]) === repairPercentage) {

                  let selectedItemX = JSON.parse(localStorage.getItem('workbench_selectedItem'));

                      const itemTypeToFValueMap = {
                          helmet: '2',
                          necklace: '11',
                          weapon: '3',
                          armor: '5',
                          shield: '4',
                          gloves: '9',
                          shoes: '10',
                          rings1: '6',
                          rings2: '7'
                      };
                      const itemxType = selectedItemX?.repaired || 0;
                      const activeItems = JSON.parse(localStorage.getItem('activeItems'));
                      const matchedKey = Object.keys(itemTypeToFValueMap).find(key => itemTypeToFValueMap[key] === itemxType);

                      if (matchedKey && activeItems[matchedKey.toLowerCase()]) {
                          activeItems[matchedKey.toLowerCase()] = false;
                          localStorage.setItem('activeItems', JSON.stringify(activeItems));
                          addLogEntry("No material found to repair.");
                      }      
                  } 
                      let selectedItemX = JSON.parse(
                        localStorage.getItem('workbench_selectedItem')
                      )

                      let selectedItemStuck = {
                        status: selectedItemX.status,
                        item: selectedItemX.item,
                        iid: selectedItemX.iid,
                        doll: selectedItemX.doll,
                        slot: selectedItemX.slot,
                        spot: selectedItemX.spot,
                        bag: selectedItemX.bag,
                        type: selectedItemX.type
                      }

                      if (repairPercentage === 0 && (selectedItemStuck.status == 'toBag' || selectedItemStuck.status == 'toPackage' || selectedItemStuck.status == 'toInv')) {
                        //itemWithZeroRepairFound = true;
                        //let selectedItemX = JSON.parse(localStorage.getItem('workbench_selectedItem'));
                        await workbench.start();
                        foundItemToRepair = true;
                        break;
                        
                    }
                      if (repairPercentage === 0) {
                          itemWithZeroRepairFound = true;
                          //let selectedItemX = JSON.parse(localStorage.getItem('workbench_selectedItem'));
                          let selectedItem = {
                              item: item,
                              name: btools.item.getItemName(item),
                              iid: item.attributes['data-item-id'].value,
                              status: 'toWorkbench',
                              spot: '',
                              bag: '',
                              doll: doll,
                              slot: '',
                              type: btools.item.getItemContainer(item),
                              repairPercentage: '',
                              repaired: btools.item.getItemContainer(item)
                          };
                          localStorage.setItem('workbench_selectedItem', JSON.stringify(selectedItem));
                          storage.workbench.selectedItem = {
                              item: item,
                              name: btools.item.getItemName(item),
                              iid: item.attributes['data-item-id'].value,
                              status: 'toWorkbench',
                              doll: doll,
                              slot: '',
                              spot: '',
                              bag: '',
                              type: btools.item.getItemContainer(item),
                              repairPercentage: '',
                              repaired: btools.item.getItemContainer(item)
                          };
                          localStorage.setItem('repairDoll', doll);
                          await workbench.start(doll);
                          foundItemToRepair = true;
                          break;
                          
                      }
                    }
                  }  
      }

      if (repairALLSelected) {
        for (let doll of dolls) {
          await processDoll(doll);
        }
      } else {
        await processDoll(dolls[0]);
      }

      // After inspecting all dolls and items, check the flag
      if (!itemWithZeroRepairFound) {
        const timers = JSON.parse(localStorage.getItem('Timers'));
        btools.setTimeOut('repair', timers['Repair'] || 10);  // Defaulting to 10 if timer doesn't exist
        //btools.setTimeOut('repair', 10);
      }
           
    }