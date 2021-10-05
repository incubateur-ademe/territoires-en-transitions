import React, {FC, useEffect, useState} from 'react';
import {FieldProps} from 'formik';
import {v4 as uuid} from 'uuid';
import {useAllStorables} from 'core-logic/hooks';
import {PlanActionStorable} from 'storables/PlanActionStorable';
import {planActionStore} from 'core-logic/api/hybridStores';
import {
  CategoryNode,
  nestPlanCategories,
} from 'app/pages/collectivite/PlanActions/sorting';
import {
  PlanActionStructure,
  PlanActionTyped,
} from 'types/PlanActionTypedInterface';
import {Menu, MenuItem, Select} from '@material-ui/core';
import NestedMenuItem from 'app/pages/collectivite/Referentiels/NestedMenuItem';
import {PlanCategorieSelection} from 'app/pages/collectivite/PlanActions/Forms/FicheActionForm';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import * as R from 'ramda';

type PlanActionStorableTyped = PlanActionStorable & PlanActionStructure;

type LinkedPlanCategoriesFieldProps = {
  ficheUid: string;
  label: string;
  id?: string;
  hint?: string;
};

/**
 * Transform category nodes into a menu of nested items.
 */
const categoriesToItems = (
  categories: CategoryNode[],
  onSelect: (categoryUid: string) => void
): React.ReactNode[] => {
  return categories.map((node: CategoryNode): React.ReactNode => {
    if (node.children.length)
      return (
        <NestedMenuItem
          key={node.categorie.uid}
          parentMenuOpen={true}
          onClick={() => onSelect(node.categorie.uid)}
          label={<div className="truncate max-w-sm">{node.categorie.nom}</div>}
        >
          {categoriesToItems(node.children, onSelect)}
        </NestedMenuItem>
      );
    return (
      <MenuItem
        key={node.categorie.uid}
        onClick={() => onSelect(node.categorie.uid)}
      >
        <div className="truncate max-w-sm">{node.categorie.nom}</div>
      </MenuItem>
    );
  });
};

/**
 * Displays a dropdown to pick plan categories when its children are clicked.
 *
 * We use a custom element as mui "Select" does not work with nested components.
 */
const PlanDropdown = (props: {
  plan: PlanActionStorable;
  onSelect: (categorieUid: string, planUid: string) => void;
  children: React.ReactNode;
}) => {
  const [opened, setOpened] = useState(false);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  const plan = props.plan as PlanActionStorable & PlanActionTyped;
  const categories = nestPlanCategories(plan.categories);

  const menuId = plan.uid;

  return (
    <>
      <div
        className="cursor-pointer w-1/3"
        aria-controls={menuId}
        aria-haspopup="true"
        onClick={e => {
          setAnchorEl(e.currentTarget);
          setOpened(!opened);
        }}
      >
        {props.children}
      </div>
      <Menu
        id={menuId}
        open={opened}
        onClose={() => setOpened(false)}
        anchorEl={anchorEl}
        getContentAnchorEl={null}
        anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
        transformOrigin={{vertical: 'top', horizontal: 'left'}}
      >
        {categoriesToItems(categories, categorieUid => {
          props.onSelect(categorieUid, plan.uid);
        })}
      </Menu>
    </>
  );
};

/**
 * A plan category selector.
 *
 * Retrieve plans and allows user to select a category in a dropdown for
 * each plan.
 */
export const PlanCategoriesSelectionField: FC<
  LinkedPlanCategoriesFieldProps & FieldProps
> = ({
  field, // { name, value, onChange, onBlur }
  form: {touched, errors, setFieldValue},
  ...props
}) => {
  const plans = useAllStorables<PlanActionStorable>(
    planActionStore
  ) as PlanActionStorableTyped[];
  const [planCategories, setPlanCategories] = useState<
    PlanCategorieSelection[]
  >(field.value as PlanCategorieSelection[]);

  const [valueUpToDate, setValueUpToDate] = useState(false);

  useEffect(() => {
    // Iterate over existing plan to find plan categories.
    const selection: PlanCategorieSelection[] = [];
    for (const plan of plans) {
      for (const fc of (plan as PlanActionStructure).fiches_by_category) {
        if (fc.fiche_uid === props.ficheUid) {
          selection.push({
            categorieUid: fc.category_uid,
            planUid: plan.uid,
          });
        }
      }
    }
    if (!planCategories.length) setPlanCategories(selection);
  }, [plans.length]);

  const htmlId = props.id ?? uuid();
  const errorMessage = errors[field.name];
  const isTouched = touched[field.name];

  const selectedPlans = R.filter(
    plan => !!planCategories.find(categorie => categorie.planUid === plan.uid),
    plans
  );
  const isPlanInFieldValue = (planUid: string): boolean =>
    R.any(planCategorie => planCategorie.planUid === planUid, planCategories);

  // When category is picked we update the input value.
  const handleCategorySelection = (categorieUid: string, planUid: string) => {
    const selected: PlanCategorieSelection = {planUid, categorieUid};

    if (isPlanInFieldValue(planUid)) {
      setPlanCategories(
        planCategories.map((categorie: PlanCategorieSelection) => {
          return categorie.planUid === planUid ? selected : categorie;
        })
      );
    } else {
      setPlanCategories([...planCategories, selected]);
      // setFieldValue(field.name,  [...planCategories, selected]);
    }
    setValueUpToDate(false);
  };

  // When plan is picked we update the input value.
  const handlePlanSelection = (selectedPlans: PlanActionTyped[]) => {
    const newValue: PlanCategorieSelection[] = selectedPlans.map(plan => {
      const matchingPlanCategorieInValue = planCategories.find(
        planCategorie => planCategorie.planUid === plan.uid
      );
      return matchingPlanCategorieInValue ?? {planUid: plan.uid};
    });
    setPlanCategories(newValue);

    setValueUpToDate(false);
    // setFieldValue(field.name, newValue);
  };

  useEffect(() => {
    setFieldValue(field.name, planCategories);
    setValueUpToDate(true);
  }, [valueUpToDate]);

  return (
    <fieldset className="block">
      {!errorMessage && props.hint && <div className="hint">{props.hint}</div>}
      {errorMessage && isTouched && (
        <div className="mt-2 text-sm opacity-80 text-red-500 pb-2">
          {errorMessage}
        </div>
      )}

      <Autocomplete
        multiple
        id={htmlId}
        options={plans}
        className="bg-beige list-none"
        renderOption={plan => plan.nom}
        getOptionLabel={plan => plan.nom}
        value={selectedPlans}
        onChange={(e, value) => {
          handlePlanSelection(value);
        }}
        renderInput={params => (
          <TextField
            {...params}
            variant="outlined"
            label={props.label}
            placeholder={props.label}
          />
        )}
      />

      {selectedPlans.map(plan => {
        const selected = planCategories.find(cat => cat.planUid === plan.uid);
        const categorie = R.find(categorie => {
          return categorie.uid === selected?.categorieUid;
        }, plan.categories);
        return (
          <div
            className="flex flex-row items-center gap-2 ml-4 my-4 w-full"
            key={plan.uid}
          >
            <div>{plan.nom} :</div>
            <PlanDropdown
              plan={plan}
              onSelect={(categorieUid: string) =>
                handleCategorySelection(categorieUid, plan.uid)
              }
              key={plan.uid}
            >
              <div className="border-gray-500 border-b-2 py-2 w-full">
                {!categorie && <span>Selectionner un axe</span>}
                {categorie && <span>{categorie.nom}</span>}
              </div>
            </PlanDropdown>
          </div>
        );
      })}
    </fieldset>
  );
};
